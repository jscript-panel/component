function _text(mode, x, y, w, h) {
	this.size = function () {
		this.ha = this.h - _scale(24);
		this.up_btn.x = this.x + Math.round((this.w - _scale(12)) / 2);
		this.down_btn.x = this.up_btn.x;
		this.up_btn.y = this.y;
		this.down_btn.y = this.y + this.h - _scale(12);
		this.update();
	}

	this.paint = function (gr) {
		if (!this.text_layout) return;
		gr.WriteTextLayout(this.text_layout, panel.colours.text, this.x, this.y + _scale(12), this.w, this.ha, this.offset);
		this.up_btn.paint(gr, panel.colours.text);
		this.down_btn.paint(gr, panel.colours.text);
	}

	this.metadb_changed = function () {
		if (panel.metadb) {
			var text = '';

			switch (this.mode) {
			case 'allmusic':
				var temp_artist = panel.tf('%album artist%');
				var temp_album = panel.tf('%album%');
				if (this.artist == temp_artist && this.album == temp_album) {
					return;
				}
				this.artist = temp_artist;
				this.album = temp_album;
				this.filename = _artistFolder(this.artist) + 'allmusic.' + utils.ReplaceIllegalChars(this.album) + '.txt';
				this.allmusic_url = false;
				if (utils.IsFile(this.filename)) {
					text = utils.ReadUTF8(this.filename).trim();
					// text is static so only check for updates if no review found previously
					if (!text.length && _fileExpired(this.filename, ONE_DAY)) {
						this.get();
					}
				} else {
					this.get();
				}
				break;
			case 'lastfm_bio':
				var temp_artist = panel.tf(DEFAULT_ARTIST);
				if (this.artist == temp_artist) {
					return;
				}
				this.artist = temp_artist;
				this.filename = _artistFolder(this.artist) + 'lastfm.artist.getInfo.' + this.langs[this.properties.lang.value] + '.json';
				if (utils.IsFile(this.filename)) {
					text = _stripTags(_.get(_jsonParseFile(this.filename), 'artist.bio.content', '')).replace('Read more on Last.fm. User-contributed text is available under the Creative Commons By-SA License; additional terms may apply.', '').trim();
					if (_fileExpired(this.filename, ONE_DAY)) {
						this.get();
					}
				} else {
					this.get();
				}
				break;
			case 'text_reader2':
				var temp_filename = panel.tf(this.properties.filename_tf.value);
				if (this.filename == temp_filename) {
					window.Repaint(); // title might have changed
					return;
				}

				this.filename = temp_filename;

				if (utils.IsFolder(this.filename)) {
					this.filename = _.first(_getFiles(this.filename, this.exts))
				}

				if (this.properties.utf8.enabled) {
					text = utils.ReadUTF8(this.filename);
				} else {
					var codepage = utils.DetectCharset(this.filename);
					text = utils.ReadTextFile(this.filename, codepage);
				}
				text = text.replace(/\t/g, '    ');
				break;
			}

			if (text != this.text) {
				this.clear_layout()
				this.text = text;
				if (this.text.length) {
					this.text_layout = utils.CreateTextLayout(this.text, this.mode == 'text_reader2' && this.properties.fixed.enabled ? 'Consolas' : panel.fonts.name, _scale(panel.fonts.size.value));
				}
			}
		} else {
			this.clear_layout();
			this.reset();
		}
		this.update();
		window.Repaint();
	}

	this.clear_layout = function () {
		if (this.text_layout) {
			this.text_layout.Dispose();
			this.text_layout = null;
		}
	}

	this.update = function (force) {
		this.text_height = 0;
		this.scroll_step = _scale(panel.fonts.size.value) * 4;

		if (this.mode == 'console') {
			if (force) {
				this.console_refresh();
			} else {
				if (!this.text_layout) return;
				this.text_height = this.text_layout.CalcTextHeight(this.w);
				if (this.text_height > this.ha) {
					this.offset = -(this.text_height - this.ha);
				} else {
					this.offset = 0;
				}
			}
		} else {
			if (force) {
				this.reset();
				panel.item_focus_change();
			} else {
				if (!this.text_layout) return;
				this.text_height = this.text_layout.CalcTextHeight(this.w);
				if (this.text_height < this.ha) this.offset = 0;
				else if (this.offset < this.ha - this.text_height) this.offset = this.ha - this.text_height;
			}
		}
	}

	this.containsXY = function (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	this.wheel = function (s) {
		if (this.containsXY(this.mx, this.my)) {
			if (this.text_height > this.ha) {
				this.offset += s * this.scroll_step;
				if (this.offset > 0) this.offset = 0;
				else if (this.offset < this.ha - this.text_height) this.offset = this.ha - this.text_height;
				window.RepaintRect(this.x, this.y, this.w, this.h);
			}
			return true;
		}
		return false;
	}

	this.move = function (x, y) {
		this.mx = x;
		this.my = y;
		window.SetCursor(IDC_ARROW);
		if (this.containsXY(x, y)) {
			this.up_btn.move(x, y);
			this.down_btn.move(x, y);
			return true;
		}
		return false;
	}

	this.lbtn_up = function (x, y) {
		if (this.containsXY(x, y)) {
			this.up_btn.lbtn_up(x, y);
			this.down_btn.lbtn_up(x, y);
			return true;
		}
		return false;
	}

	this.rbtn_up = function (x, y) {
		switch (this.mode) {
		case 'allmusic':
			this.cb = utils.GetClipboardText();
			panel.m.AppendMenuItem(EnableMenuIf(panel.metadb && this.cb.length > 0 && _tagged(this.artist) && _tagged(this.album)), 1000, 'Paste text from clipboard');
			panel.m.AppendMenuSeparator();
			break;
		case 'console':
			panel.m.AppendMenuItem(MF_STRING, 1010, 'Clear');
			panel.m.AppendMenuSeparator();
			break;
		case 'lastfm_bio':
			panel.m.AppendMenuItem(EnableMenuIf(panel.metadb), 1100, 'Force update');
			panel.m.AppendMenuSeparator();
			_.forEach(this.langs, function (item, i) {
				panel.s10.AppendMenuItem(MF_STRING, i + 1110, item);
			});
			panel.s10.CheckMenuRadioItem(1110, 1121, this.properties.lang.value + 1110);
			panel.s10.AppendTo(panel.m, MF_STRING, 'Last.fm language');
			panel.m.AppendMenuSeparator();
			break;
		case 'text_reader2':
			panel.m.AppendMenuItem(MF_STRING, 1300, 'Refresh');
			panel.m.AppendMenuSeparator();
			panel.m.AppendMenuItem(MF_STRING, 1301, 'Custom title...');
			panel.m.AppendMenuSeparator();
			panel.m.AppendMenuItem(MF_STRING, 1302, 'Custom path...');
			panel.m.AppendMenuSeparator();
			panel.m.AppendMenuItem(CheckMenuIf(this.properties.fixed.enabled), 1303, 'Fixed width font');
			panel.m.AppendMenuSeparator();
			panel.s10.AppendMenuItem(MF_STRING, 1310, 'UTF8');
			panel.s10.AppendMenuItem(MF_STRING, 1311, 'Auto-detect');
			panel.s10.CheckMenuRadioItem(1310, 1311, this.properties.utf8.enabled ? 1310 : 1311);
			panel.s10.AppendTo(panel.m, MF_STRING, 'Encoding');
			panel.s10.App
			panel.m.AppendMenuSeparator();
			break;
		}
		if (this.mode != 'console') {
			panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.filename)), 1999, 'Open containing folder');
			panel.m.AppendMenuSeparator();
		}
	}

	this.rbtn_up_done = function (idx) {
		switch (idx) {
		case 1000:
			_save(this.filename, this.cb);
			this.artist = '';
			panel.item_focus_change();
			break;
		case 1010:
			console.ClearBacklog();
			break;
		case 1100:
			this.get();
			break;
		case 1110:
		case 1111:
		case 1112:
		case 1113:
		case 1114:
		case 1115:
		case 1116:
		case 1117:
		case 1118:
		case 1119:
		case 1120:
		case 1121:
			this.properties.lang.value = idx - 1110;
			this.artist = '';
			panel.item_focus_change();
			break;
		case 1300:
			this.filename = '';
			panel.item_focus_change();
			break;
		case 1301:
			this.properties.title_tf.value = utils.InputBox('You can use full title formatting here.', window.Name, this.properties.title_tf.value);
			window.Repaint();
			break;
		case 1302:
			this.properties.filename_tf.value = utils.InputBox('Use title formatting to specify a path to a text file. eg: $directory_path(%path%)\\info.txt\n\nIf you prefer, you can specify just the path to a folder and the first txt or log file will be used.', window.Name, this.properties.filename_tf.value);
			panel.item_focus_change();
			break;
		case 1303:
			this.properties.fixed.toggle();
			this.reset();
			panel.item_focus_change();
			break;
		case 1310:
		case 1311:
			this.properties.utf8.enabled = idx == 1310;
			this.reset();
			panel.item_focus_change();
			break;
		case 1999:
			_explorer(this.filename);
			break;
		}
	}

	this.key_down = function (k) {
		switch (k) {
		case VK_UP:
			this.wheel(1);
			return true;
		case VK_DOWN:
			this.wheel(-1);
			return true;
		default:
			return false;
		}
	}

	this.header_text = function () {
		switch (this.mode) {
		case 'allmusic':
			return panel.tf('%album artist%[ - %album%]');
		case 'console':
			return 'Console';
		case 'lastfm_bio':
			return this.artist;
		case 'text_reader2':
			return panel.tf(this.properties.title_tf.value);
		}
		return '';
	}

	this.reset = function () {
		this.text = this.artist = this.filename = '';
	}

	this.init = function () {
		switch (this.mode) {
		case 'allmusic':
			this.get = function () {
				if (this.allmusic_url) {
					var url = this.allmusic_url;
				} else {
					if (!_tagged(this.artist) || !_tagged(this.album)) {
						return;
					}
					var url = 'https://www.allmusic.com/search/albums/' + encodeURIComponent(this.album + (this.artist.toLowerCase() == 'various artists' ? '' : ' ' + this.artist));
				}
				var task_id = utils.HTTPRequestAsync(window.ID, 0, url);
				this.filenames[task_id] = this.filename;
			}

			this.http_request_done = function (id, success, response_text) {
				var f = this.filenames[id];
				if (!f) return;
				if (!success) return console.log(N, response_text);

				if (this.allmusic_url) {
					this.allmusic_url = false;
					var content = _(_getElementsByTagName(response_text, 'div'))
						.filter({className : 'text'})
						.map('innerText')
						.value();
					console.log(N, content.length ? 'A review was found and saved.' : 'No review was found on the page for this album.');
					if (_save(f, content)) {
						this.artist = '';
						panel.item_focus_change();
					}
				} else {
					try {
						this.allmusic_url = '';
						_(_getElementsByTagName(response_text, 'li'))
							.filter({className : 'album'})
							.forEach(function (item) {
								var divs = item.getElementsByTagName('div');
								var album = _.first(divs[2].getElementsByTagName('a')).innerText;
								var tmp = divs[3].getElementsByTagName('a');
								var artist = tmp.length ? _.first(tmp).innerText : 'various artists';
								if (this.is_match(artist, album)) {
									this.allmusic_url = _.first(divs[2].getElementsByTagName('a')).href;
									return false;
								}
							}, this)
							.value();
						if (this.allmusic_url.length) {
							console.log(N, 'A page was found for ' + _q(this.album) + '. Now checking for review...');
							this.get();
						} else {
							console.log(N, 'Could not match artist/album on the Allmusic website.');
							_save(f, '');
						}
					} catch (e) {
						console.log(N, 'Could not parse Allmusic server response.');
					}
				}
			}

			this.is_match = function (artist, album) {
				if (!panel.metadb) {
					return false;
				}
				return this.tidy(artist) == this.tidy(this.artist) && this.tidy(album) == this.tidy(this.album);
			}

			this.tidy = function (value) {
				var tfo = fb.TitleFormat('$replace($lower($ascii(' + _fbEscape(value) + ')), & ,, and ,)');
				var str = tfo.EvalWithMetadb(panel.metadb);
				tfo.Dispose();
				return str;
			}

			utils.CreateFolder(folders.artists);
			break;
		case 'console':
			this.console_refresh = function () {
				this.clear_layout();
				var lines = _(console.GetLines().toArray())
					.filter(function (item) {
						return item.indexOf("Using decoder shim") == -1;
					})
					.takeRight(100)
					.value();
				var text = lines.join('\n');
				if (text.length) {
					this.text_layout = utils.CreateTextLayout(text, panel.fonts.name, _scale(panel.fonts.size.value));
					this.update();
				}
			}
			break;
		case 'lastfm_bio':
			this.get = function () {
				if (!_tagged(this.artist)) {
					return;
				}
				var url = lastfm.base_url + '&method=artist.getInfo&autocorrect=1&lang=' + this.langs[this.properties.lang.value] + '&artist=' + encodeURIComponent(this.artist);
				utils.DownloadFileAsync(window.ID, url, this.filename);
			}

			this.download_file_done = function (path, success, error_text) {
				if (!success) return console.log(N, error_text);
				this.artist = '';
				panel.item_focus_change();
			}

			utils.CreateFolder(folders.artists);
			this.langs = ['en', 'de', 'es', 'fr', 'it', 'ja', 'pl', 'pt', 'ru', 'sv', 'tr', 'zh'];
			this.properties.lang = new _p('2K3.TEXT.BIO.LANG', 0);
			break;
		case 'text_reader2':
			this.properties.title_tf = new _p('2K3.TEXT.TITLE.TF', '%artist% - %title%');
			this.properties.filename_tf = new _p('2K3.TEXT.FILENAME.TF', '$directory_path(%path%)');
			this.properties.fixed = new _p('2K3.TEXT.FONTS.FIXED', true);
			this.properties.utf8 = new _p('2K3.TEXT.UTF8', true);
			this.exts = ['txt', 'log'];
			break;
		}
	}

	panel.text_objects.push(this);
	this.mode = mode;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.ha = h - _scale(24); // height adjusted for up/down buttons
	this.text_layout = null;
	this.text_height = 0;
	this.scroll_step = 0;
	this.mx = 0;
	this.my = 0;
	this.offset = 0;
	this.text = '';
	this.artist = '';
	this.album = '';
	this.filename = '';
	this.filenames = {};
	this.up_btn = new _sb(chars.up, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset < 0; }, this), _.bind(function () { this.wheel(1); }, this));
	this.down_btn = new _sb(chars.down, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset > this.ha - this.text_height; }, this), _.bind(function () { this.wheel(-1); }, this));
	this.properties = {};
	this.init();
}
