_.mixin({
	nest : function(collection, keys) {
		if (!keys.length) {
			return collection;
		}
		return _(collection)
			.groupBy(keys[0])
			.mapValues(function (values) {
				return _.nest(values, keys.slice(1));
			})
			.value();
	}
});

function _list(mode, x, y, w, h) {
	this.containsXY = function (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	this.draw_row = function (gr, text, colour, x, y, w, h, text_alignment) {
		gr.WriteTextSimple(text, panel.fonts.normal, colour, x, y, w, h, text_alignment || DWRITE_TEXT_ALIGNMENT_LEADING, DWRITE_PARAGRAPH_ALIGNMENT_CENTER, DWRITE_WORD_WRAPPING_NO_WRAP, DWRITE_TRIMMING_GRANULARITY_CHARACTER);
	}

	this.header_text = function () {
		switch (this.mode) {
		case 'lastfm_info':
			if (this.properties.mode.value == 0) {
				return this.artist + ': ' + this.artist_methods[this.properties.artist_method.value].display;
			} else {
				if (this.properties.user_mode.value == 0) {
					return lastfm.username + ': ' + this.chart_periods[this.properties.charts_period.value].display + ' ' + this.chart_methods[this.properties.charts_method.value].display + ' charts';
				} else {
					return lastfm.username + ': recent tracks';
				}
			}
			break;
		case 'musicbrainz':
			return this.artist + ': ' + (this.properties.mode.value == 0 ? 'releases' : 'links');
		case 'properties':
		case 'properties_other_info':
			return panel.tf('%artist% - %title%');
		}
	}

	this.init = function () {
		switch (this.mode) {
		case 'lastfm_info':
			this.get = function () {
				switch (this.properties.mode.value) {
				case 0:
					if (!_tagged(this.artist)) {
						return;
					}
					var url = lastfm.base_url + '&limit=100&method=' + this.artist_methods[this.properties.artist_method.value].method + '&artist=' + encodeURIComponent(this.artist);
					break;
				case 1:
					if (this.properties.user_mode.value == 0) {
						var url = lastfm.base_url + '&limit=100&method=' + this.chart_methods[this.properties.charts_method.value].method + '&period=' + this.chart_periods[this.properties.charts_period.value].period + '&user=' + lastfm.username;
					} else {
						var url = lastfm.base_url + '&limit=100&method=user.getRecentTracks&user=' + lastfm.username;
					}
					break;
				}
				var task_id = utils.HTTPRequestAsync(window.ID, 0, url, lastfm.ua);
				this.filenames[task_id] = this.filename;
			}

			this.http_request_done = function (id, success, response_text) {
				var f = this.filenames[id];
				if (!f) return;
				if (!success) return console.log(N, response_text);

				var data = _jsonParse(response_text);
				if (data.error) {
					return console.log(N, data.message);
				}

				if (_save(f, response_text)) {
					if (this.properties.mode.value == 0) {
						this.reset();
					} else {
						this.update();
					}
				}
			}

			this.artist_methods = [{
					method : 'artist.getSimilar',
					json : 'similarartists.artist',
					display : 'similar artists',
				}, {
					method : 'artist.getTopTracks',
					json : 'toptracks.track',
					display : 'top tracks',
				}, {
					method : 'artist.getTopTags',
					json : 'toptags.tag',
					display : 'top tags',
				}
			];

			this.chart_methods = [{
					method : 'user.getTopArtists',
					json : 'topartists.artist',
					display : 'artist',
				}, {
					method : 'user.getTopAlbums',
					json : 'topalbums.album',
					display : 'album',
				}, {
					method : 'user.getTopTracks',
					json : 'toptracks.track',
					display : 'track',
				}
			];

			this.chart_periods = [{
					period : 'overall',
					display : 'overall',
				}, {
					period : '7day',
					display : 'last 7 days',
				}, {
					period : '1month',
					display : '1 month',
				}, {
					period : '3month',
					display : '3 month',
				}, {
					period : '6month',
					display : '6 month',
				}, {
					period : '12month',
					display : '12 month',
				}
			];

			this.properties = {
				mode : new _p('2K3.LIST.LASTFM.MODE2', 0), // 0 artist 1 user
				artist_method : new _p('2K3.LIST.LASTFM.ARTIST.METHOD', 0), // 0 similar artists 1 top tracks 2 top tags
				user_mode : new _p('2K3.LIST.LASTFM.USER.MODE', 0), // 0 charts 1 recent tracks
				charts_method : new _p('2K3.LIST.LASTFM.CHARTS.METHOD', 0),
				charts_period : new _p('2K3.LIST.LASTFM.CHARTS.PERIOD', 0),
			};

			utils.CreateFolder(folders.artists);
			utils.CreateFolder(folders.lastfm);
			this.time_elapsed = 0;

			if (this.properties.mode.value == 1) {
				this.update();
			}
			break;
		case 'musicbrainz':
			this.get = function () {
				if (this.properties.mode.value == 0) {
					var url = 'https://musicbrainz.org/ws/2/release-group?fmt=json&limit=100&offset=' + this.mb_offset + '&artist=' + this.mb_id;
				} else {
					var url = 'https://musicbrainz.org/ws/2/artist/' + this.mb_id + '?fmt=json&inc=url-rels';
				}
				var task_id = utils.HTTPRequestAsync(window.ID, 0, url, 'foo_jscript_panel_musicbrainz');
				this.filenames[task_id] = this.filename;
			}

			this.http_request_done = function (id, success, response_text) {
				var f = this.filenames[id];
				if (!f) return;
				if (!success) return console.log(N, response_text);

				if (this.properties.mode.value == 0) {
					var data = _jsonParse(response_text);
					var max_offset = Math.min(500, data['release-group-count'] || 0) - 100;
					var rg = data['release-groups'] || [];
					if (rg.length) {
						Array.prototype.push.apply(this.mb_data, rg);
					}
					if (this.mb_offset < max_offset) {
						this.mb_offset += 100;
						this.get();
					} else {
						if (_save(f, JSON.stringify(this.mb_data))) {
							this.reset();
						}
					}
				} else {
					if (_save(f, response_text)) {
						this.reset();
					}
				}
			}

			utils.CreateFolder(folders.artists);
			this.mb_id = '';
			this.properties = {
				mode : new _p('2K3.LIST.MUSICBRAINZ.MODE', 0) // 0 releases 1 links
			};
			break;
		case 'properties':
		case 'properties_other_info':
			this.get_musicbrainz_url = function (name, value) {
				switch (name) {
				case 'MUSICBRAINZ_ARTISTID':
				case 'MUSICBRAINZ_ALBUMARTISTID':
				case 'MUSICBRAINZ ARTIST ID':
				case 'MUSICBRAINZ ALBUM ARTIST ID':
					return 'https://musicbrainz.org/artist/' + value;
				case 'MUSICBRAINZ_ALBUMID':
				case 'MUSICBRAINZ ALBUM ID':
					return 'https://musicbrainz.org/release/' + value;
				case 'MUSICBRAINZ_RELEASEGROUPID':
				case 'MUSICBRAINZ RELEASE GROUP ID':
					return 'https://musicbrainz.org/release-group/' + value;
				case 'MUSICBRAINZ_RELEASETRACKID':
				case 'MUSICBRAINZ RELEASE TRACK ID':
					return 'https://musicbrainz.org/track/' + value;
				case 'MUSICBRAINZ_TRACKID':
				case 'MUSICBRAINZ TRACK ID':
					return 'https://musicbrainz.org/recording/' + value;
				case 'MUSICBRAINZ_WORKID':
				case 'MUSICBRAINZ WORK ID':
					return 'https://musicbrainz.org/work/' + value;
				default:
					return '';
				}
			}

			this.add_meta = function (f) {
				if (!f) return;
				for (var i = 0; i < f.MetaCount; i++) {
					var name = f.MetaName(i).toUpperCase();
					var num = f.MetaValueCount(i);
					for (var j = 0; j < num; j++) {
						var value = f.MetaValue(i, j).replace(/\s{2,}/g, ' ');
						var url = '';
						if (_isUUID(value)) {
							url = this.get_musicbrainz_url(name, value);
						}
						if (url.empty()) {
							url = name.toLowerCase() + (num == 1 ? ' IS ' : ' HAS ') + value;
						}
						this.data.push({
							name : j == 0 ? name : '',
							value : value,
							url : url
						});
					}
				}

				if (this.data.length) {
					if (this.mode == 'properties_other_info') {
						this.data.unshift({
							name : 'Metadata',
							value : 'SECTION_HEADER',
						});
					}
					this.add_separator();
				}
			}

			this.add_location = function () {
				var names = ['FILE NAME', 'FOLDER NAME', 'FILE PATH', 'SUBSONG INDEX', 'FILE SIZE', 'FILE CREATED', 'LAST MODIFIED'];
				var values = [panel.tf('%filename_ext%'), panel.tf('$directory_path(%path%)'), this.filename, panel.metadb.SubSong, panel.tf('[%filesize_natural%]'), panel.tf('[%file_created%]'), panel.tf('[%last_modified%]')];
				var urls = ['%filename_ext% IS ', '"$directory_path(%path%)" IS ', '%path% IS ', '%subsong% IS ', '%filesize_natural% IS ', '%file_created% IS ', '%last_modified% IS '];
				for (var i = 0; i < 7; i++) {
					this.data.push({
						name : names[i],
						value : values[i],
						url : urls[i] + values[i]
					});
				}
				this.add_separator();
			}

			this.add_tech = function (f) {
				if (!f) return;
				var duration = utils.FormatDuration(Math.max(0, panel.metadb.Length));
				this.data.push({
					name : 'DURATION',
					value : duration,
					url : '%length% IS ' + duration,
				});
				var tmp = [];
				for (var i = 0; i < f.InfoCount; i++) {
					var name = f.InfoName(i);
					var value = f.InfoValue(i).replace(/\s{2,}/g, ' ');
					tmp.push({
						name : name.toUpperCase(),
						value : value,
						url : '%__' + name.toLowerCase() + '% IS ' + value
					});
				}
				Array.prototype.push.apply(this.data, _.sortByOrder(tmp, 'name'));
				this.add_separator();
			}

			this.add_section = function (obj, name) {
				this.data.push({
					name : name,
					value : 'SECTION_HEADER',
				});
				for (var i in obj) {
					this.data.push({
						name : i,
						value : obj[i],
					});
				}
				this.add_separator();
			}

			this.add_other_info = function () {
				var tmp = JSON.parse(fb.CreateHandleList(panel.metadb).GetOtherInfo());
				_.forEach(['Location', 'General'], function (item) {
					this.add_section(tmp[item], item);
				}, this);
				for (var i in tmp) {
					if (i != 'General' && i != 'Location') {
						this.add_section(tmp[i], i);
					}
				}
			}

			this.add_separator = function () {
				this.data.push({ name : '', value : '' });
			}

			if (this.mode == 'properties') {
				this.properties = {
					meta : new _p('2K3.LIST.PROPERTIES.META', true),
					location : new _p('2K3.LIST.PROPERTIES.LOCATION', true),
					tech : new _p('2K3.LIST.PROPERTIES.TECH', true),
				};
			}

			this.properties_value_x = 0;
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

	this.lbtn_up = function (x, y) {
		if (this.containsXY(x, y)) {
			switch (true) {
			case this.up_btn.lbtn_up(x, y):
			case this.down_btn.lbtn_up(x, y):
			case !this.in_range:
				break;
			case x > this.x + this.clickable_text_x && x < this.x + this.clickable_text_x + Math.min(this.data[this.index].width, this.text_width) && typeof this.data[this.index].url == 'string':
				if (_.startsWith(this.data[this.index].url, 'http')) {
					utils.Run(this.data[this.index].url);
				} else {
					plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, this.data[this.index].value, this.data[this.index].url);
				}
				break;
			}
			return true;
		}
		return false;
	}

	this.metadb_changed = function () {
		switch (true) {
		case this.mode == 'lastfm_info' && this.properties.mode.value > 0:
			break;
		case !panel.metadb:
			this.artist = '';
			this.filename = '';
			this.data = [];
			this.count = 0;
			window.Repaint();
			break;
		case this.mode == 'properties':
		case this.mode == 'properties_other_info':
			this.update();
			break;
		case this.mode == 'musicbrainz':
			var temp_artist = panel.tf(DEFAULT_ARTIST);
			var temp_id = panel.tf('$if3($meta(musicbrainz_artistid,0),$meta(musicbrainz artist id,0),)');
			if (this.artist == temp_artist && this.mb_id == temp_id) {
				return;
			}
			this.artist = temp_artist;
			this.mb_id = temp_id;
			this.update();
			break;
		default:
			var temp_artist = panel.tf(DEFAULT_ARTIST);
			if (this.artist == temp_artist) {
				return;
			}
			this.artist = temp_artist;
			this.update();
			break;
		}
	}

	this.move = function (x, y) {
		this.mx = x;
		this.my = y;
		window.SetCursor(IDC_ARROW);
		if (this.containsXY(x, y)) {
			this.index = Math.floor((y - this.y - _scale(12)) / panel.row_height) + this.offset;
			this.in_range = this.index >= this.offset && this.index < this.offset + Math.min(this.rows, this.count);
			switch (true) {
			case this.up_btn.move(x, y):
			case this.down_btn.move(x, y):
				break;
			case !this.in_range:
				break;
			case x > this.x + this.clickable_text_x && x < this.x + this.clickable_text_x + Math.min(this.data[this.index].width, this.text_width) && typeof this.data[this.index].url == 'string':
				window.SetCursor(IDC_HAND);
				if (_.startsWith(this.data[this.index].url, 'http')) {
					_tt(this.data[this.index].url);
				} else {
					_tt('Autoplaylist: ' + this.data[this.index].url);
				}
				break;
			default:
				_tt('');
				break;
			}
			return true;
		}
		return false;
	}

	this.paint = function (gr) {
		if (this.count == 0) {
			return;
		}
		switch (true) {
		case this.mode == 'lastfm_info' && this.properties.mode.value == 1 && this.properties.user_mode.value == 0: // charts
			this.clickable_text_x = this.spacer_w + 5;
			this.text_width = Math.round(this.w * 0.5);
			var lastfm_charts_bar_x = this.x + this.clickable_text_x + this.text_width + 10;
			var unit_width = (this.w - lastfm_charts_bar_x - _scale(50)) / this.data[0].playcount;
			for (var i = 0; i < Math.min(this.count, this.rows); i++) {
				var bar_width = Math.ceil(unit_width * this.data[i + this.offset].playcount);
				this.draw_row(gr, this.data[i + this.offset].rank + '.', panel.colours.highlight, this.x, this.y + _scale(12) + (i * panel.row_height), this.clickable_text_x - 5, panel.row_height, DWRITE_TEXT_ALIGNMENT_TRAILING);
				this.draw_row(gr, this.data[i + this.offset].name, panel.colours.text, this.x + this.clickable_text_x, this.y + _scale(12) + (i * panel.row_height), this.text_width, panel.row_height);
				gr.FillRectangle(lastfm_charts_bar_x, this.y + _scale(13) + (i * panel.row_height), bar_width, panel.row_height - 3, panel.colours.highlight);
				this.draw_row(gr, _formatNumber(this.data[i + this.offset].playcount, ','), panel.colours.text, lastfm_charts_bar_x + bar_width + 5, this.y + _scale(12) + (i * panel.row_height), _scale(60), panel.row_height);
			}
			break;
		case this.mode == 'musicbrainz' && this.properties.mode.value == 0: // releases
			this.text_width = this.w - this.spacer_w - 10;
			for (var i = 0; i < Math.min(this.count, this.rows); i++) {
				if (this.data[i + this.offset].url == 'SECTION_HEADER') {
					this.draw_row(gr, this.data[i + this.offset].name, panel.colours.highlight, this.x, this.y + _scale(12) + (i * panel.row_height), this.text_width, panel.row_height);
				} else {
					this.draw_row(gr, this.data[i + this.offset].name, panel.colours.text, this.x, this.y + _scale(12) + (i * panel.row_height), this.text_width, panel.row_height);
					this.draw_row(gr, this.data[i + this.offset].date, panel.colours.highlight, this.x, this.y + _scale(12) + (i * panel.row_height), this.w, panel.row_height, DWRITE_TEXT_ALIGNMENT_TRAILING);
				}
			}
			break;
		case this.mode == 'properties':
		case this.mode == 'properties_other_info':
			this.clickable_text_x = Math.min(this.w * 0.5, this.properties_value_x);
			this.text_width = this.w - this.clickable_text_x;
			for (var i = 0; i < Math.min(this.count, this.rows); i++) {
				if (this.data[i + this.offset].value == 'SECTION_HEADER') {
					this.draw_row(gr, this.data[i + this.offset].name, panel.colours.highlight, this.x, this.y + _scale(12) + (i * panel.row_height), this.w, panel.row_height);
				} else {
					this.draw_row(gr, this.data[i + this.offset].name, panel.colours.text, this.x, this.y + _scale(12) + (i * panel.row_height), this.clickable_text_x - 10, panel.row_height);
					this.draw_row(gr, this.data[i + this.offset].value, panel.colours.highlight, this.x + this.clickable_text_x, this.y + _scale(12) + (i * panel.row_height), this.text_width, panel.row_height);
				}
			}
			break;
		default: // other last.fm / musicbrainz links
			this.clickable_text_x = 0;
			this.text_width = this.w;
			for (var i = 0; i < Math.min(this.count, this.rows); i++) {
				this.draw_row(gr, this.data[i + this.offset].name, panel.colours.text, this.x, this.y + _scale(12) + (i * panel.row_height), this.text_width, panel.row_height);
			}
			break;
		}
		this.up_btn.paint(gr, panel.colours.text);
		this.down_btn.paint(gr, panel.colours.text);
	}

	this.playback_new_track = function () {;
		this.time_elapsed = 0;
		panel.item_focus_change();
	}

	this.playback_time = function () {
		if (this.mode == 'lastfm_info') {
			this.time_elapsed++;
			if (this.time_elapsed == 3 && this.properties.mode.value == 1 && this.properties.user_mode.value == 1 && lastfm.username.length) {
				this.get();
			}
		}
	}

	this.rbtn_up = function (x, y) {
		switch (this.mode) {
		case 'lastfm_info':
			panel.m.AppendMenuItem(MF_STRING, 1100, 'Artist Info');
			panel.m.AppendMenuItem(MF_STRING, 1101, 'User Info');
			panel.m.CheckMenuRadioItem(1100, 1101, this.properties.mode.value + 1100);
			panel.m.AppendMenuSeparator();

			if (this.properties.mode.value == 0) {
				panel.m.AppendMenuItem(MF_STRING, 1102, 'Similar Artists');
				panel.m.AppendMenuItem(MF_STRING, 1103, 'Top Tracks');
				panel.m.AppendMenuItem(MF_STRING, 1104, 'Top Tags');
				panel.m.CheckMenuRadioItem(1102, 1104, this.properties.artist_method.value + 1102);
				panel.m.AppendMenuSeparator();
			} else {
				panel.m.AppendMenuItem(MF_STRING, 1110, 'Charts');
				panel.m.AppendMenuItem(MF_STRING, 1111, 'Recent Tracks');
				panel.m.CheckMenuRadioItem(1110, 1111, this.properties.user_mode.value + 1110);
				panel.m.AppendMenuSeparator();

				if (this.properties.user_mode.value == 0) {
					this.chart_methods.forEach(function (item, i) {
						panel.m.AppendMenuItem(MF_STRING, i + 1120, _.capitalize(item.display));
					});
					panel.m.CheckMenuRadioItem(1120, 1122, this.properties.charts_method.value + 1120);
					panel.m.AppendMenuSeparator();
					this.chart_periods.forEach(function (item, i) {
						panel.m.AppendMenuItem(MF_STRING, i + 1130, _.capitalize(item.display));
					});
					panel.m.CheckMenuRadioItem(1130, 1135, this.properties.charts_period.value + 1130);
					panel.m.AppendMenuSeparator();
				}
			}

			panel.m.AppendMenuItem(MF_STRING, 1150, 'Last.fm username...');
			panel.m.AppendMenuSeparator();
			break;
		case 'musicbrainz':
			panel.m.AppendMenuItem(MF_STRING, 1200, 'Releases');
			panel.m.AppendMenuItem(MF_STRING, 1201, 'Links');
			panel.m.CheckMenuRadioItem(1200, 1201, this.properties.mode.value + 1200);
			panel.m.AppendMenuSeparator();
			if (!_isUUID(this.mb_id)) {
				panel.m.AppendMenuItem(MF_GRAYED, 0, 'Artist MBID missing. Use Musicbrainz Picard or foo_musicbrainz to tag your files.');
				panel.m.AppendMenuSeparator();
			}
			break;
		case 'properties':
			panel.m.AppendMenuItem(CheckMenuIf(this.properties.meta.enabled), 1300, 'Metadata');
			panel.m.AppendMenuItem(CheckMenuIf(this.properties.location.enabled), 1301, 'Location');
			panel.m.AppendMenuItem(CheckMenuIf(this.properties.tech.enabled), 1302, 'Tech Info');
			panel.m.AppendMenuSeparator();
			break;
		}
		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.filename)), 1999, 'Open containing folder');
		panel.m.AppendMenuSeparator();
	}

	this.rbtn_up_done = function (idx) {
		switch (idx) {
		case 1100:
			this.properties.mode.value = 0;
			this.reset();
			break;
		case 1101:
			this.properties.mode.value = 1;
			this.update();
			break;
		case 1102:
		case 1103:
		case 1104:
			this.properties.artist_method.value = idx - 1102;
			this.reset();
			break;
		case 1110:
		case 1111:
			this.properties.user_mode.value = idx - 1110;
			this.update();
			break;
		case 1120:
		case 1121:
		case 1122:
			this.properties.charts_method.value = idx - 1120;
			this.update();
			break;
		case 1130:
		case 1131:
		case 1132:
		case 1133:
		case 1134:
		case 1135:
			this.properties.charts_period.value = idx - 1130;
			this.update();
			break;
		case 1150:
			lastfm.update_username();
			break;
		case 1200:
		case 1201:
			this.properties.mode.value = idx - 1200;
			this.reset();
			break;
		case 1300:
			this.properties.meta.toggle();
			this.metadb_changed();
			break;
		case 1301:
			this.properties.location.toggle();
			this.metadb_changed();
			break;
		case 1302:
			this.properties.tech.toggle();
			this.metadb_changed();
			break;
		case 1999:
			_explorer(this.filename);
			break;
		}
	}

	this.reset = function () {
		this.count = 0;
		this.data = [];
		this.artist = '';
		this.metadb_changed();
	}

	this.size = function (update) {
		this.index = 0;
		this.offset = 0;
		this.rows = Math.floor((this.h - _scale(24)) / panel.row_height);
		this.up_btn.x = this.x + Math.round((this.w - _scale(12)) * 0.5);
		this.down_btn.x = this.up_btn.x;
		this.up_btn.y = this.y;
		this.down_btn.y = this.y + this.h - _scale(12);
		if (update) this.update();
	}

	this.update = function () {
		this.data = [];
		this.spacer_w = panel.calc_text_width('0000');
		switch (this.mode) {
		case 'lastfm_info':
			this.filename = '';
			switch (this.properties.mode.value) {
			case 0:
				this.filename = _artistFolder(this.artist) + 'lastfm.' + this.artist_methods[this.properties.artist_method.value].method + '.json';
				if (utils.IsFile(this.filename)) {
					this.data = _(_.get(_jsonParseFile(this.filename), this.artist_methods[this.properties.artist_method.value].json, []))
						.map(function (item) {
							return {
								name : item.name,
								width : panel.calc_text_width(item.name),
								url : item.url
							};
						}, this)
						.value();
					if (_fileExpired(this.filename, ONE_DAY)) {
						this.get();
					}
				} else {
					this.get();
				}
				break;
			case 1:
				if (!lastfm.username.length) {
					console.log(N, 'Last.fm username not set.');
					break;
				}

				if (this.properties.user_mode.value == 0) {
					this.filename = folders.lastfm + lastfm.username + '.' + this.chart_methods[this.properties.charts_method.value].method + '.' + this.chart_periods[this.properties.charts_period.value].period + '.json';
					if (utils.IsFile(this.filename)) {
						var data = _.get(_jsonParseFile(this.filename), this.chart_methods[this.properties.charts_method.value].json, []);
						for (var i = 0; i < data.length; i++) {
							if (this.properties.charts_method.value == 0) {
								var name = data[i].name;
								var url = data[i].url;
							} else {
								var name = data[i].artist.name + ' - ' + data[i].name;
								var url = data[i].url;
							}
							this.data[i] = {
								name : name,
								width : panel.calc_text_width(name),
								url : url,
								playcount : data[i].playcount,
								rank : i > 0 && data[i].playcount == data[i - 1].playcount ? this.data[i - 1].rank : i + 1
							};
						}
						if (_fileExpired(this.filename, ONE_DAY)) {
							this.get();
						}
					} else {
						this.get();
					}
				} else {
					this.filename = folders.lastfm + lastfm.username + '.user.getRecentTracks.json';
					if (utils.IsFile(this.filename)) {
						this.data = _(_.get(_jsonParseFile(this.filename), 'recenttracks.track', []))
							.filter('date')
							.map(function (item) {
								var name = item.artist['#text'] + ' - ' + item.name;
								return {
									name : name,
									width : panel.calc_text_width(name),
									url : item.url
								};
							})
							.value();
					} else {
						this.get();
					}
				}
			}
			break;
		case 'musicbrainz':
			if (!_isUUID(this.mb_id)) break;

			if (this.properties.mode.value == 0) {
				this.mb_data = [];
				this.mb_offset = 0;
				this.filename = _artistFolder(this.artist) + 'musicbrainz.releases.' + this.mb_id + '.json';
				if (utils.IsFile(this.filename)) {
					var data = _(_jsonParseFile(this.filename))
						.sortByOrder(['first-release-date', 'title'], ['desc', 'asc'])
						.map(function (item) {
							return {
								name : item.title,
								width : panel.calc_text_width(item.title),
								url : 'https://musicbrainz.org/release-group/' + item.id,
								date : item['first-release-date'].substring(0, 4),
								primary : item['primary-type'],
								secondary : item['secondary-types'].sort()[0] || null
							};
						})
						.nest(['primary', 'secondary'])
						.value();
					_.forEach(['Album', 'Single', 'EP', 'Other', 'Broadcast', 'null'], function (primary) {
						_.forEach(['null', 'Audiobook', 'Compilation', 'Demo', 'DJ-mix', 'Interview', 'Live', 'Mixtape/Street', 'Remix', 'Spokenword', 'Soundtrack'], function (secondary) {
							var group = _.get(data, primary + '.' + secondary);
							if (group) {
								var name = (primary + ' + ' + secondary).replace('null + null', 'Unspecified type').replace('null + ', '').replace(' + null', '');
								this.data.push({name : name, width : 0, url : 'SECTION_HEADER', date : ''});
								Array.prototype.push.apply(this.data, group);
								this.data.push({name : '', width : 0, url : '', date : ''});
							}
						}, this);
					}, this);
					this.data.pop();
					if (_fileExpired(this.filename, ONE_DAY)) {
						this.get();
					}
				} else {
					this.get();
				}
			} else {
				this.filename = _artistFolder(this.artist) + 'musicbrainz.links.' + this.mb_id + '.json';
				if (utils.IsFile(this.filename)) {
					var url = 'https://musicbrainz.org/artist/' + this.mb_id;
					this.data = _(_.get(_jsonParseFile(this.filename), 'relations', []))
						.map(function (item) {
							var url = decodeURIComponent(item.url.resource);
							return {
								name : url,
								url : url,
								width : panel.calc_text_width(url)
							};
						})
						.sortBy(function (item) {
							return item.name.split('//')[1].replace('www.', '');
						})
						.value();
					this.data.unshift({
						name : url,
						url : url,
						width : panel.calc_text_width(url)
					});
					if (_fileExpired(this.filename, ONE_DAY)) {
						this.get();
					}
				} else {
					this.get();
				}
			}
			break;
		case 'properties':
		case 'properties_other_info':
			this.properties_value_x = 0;
			this.filename = panel.metadb.Path;
			var fileinfo = panel.metadb.GetFileInfo();
			if (this.mode == 'properties') {
				if (this.properties.meta.enabled) {
					this.add_meta(fileinfo);
				}
				if (this.properties.location.enabled) {
					this.add_location();
				}
				if (this.properties.tech.enabled) {
					this.add_tech(fileinfo);
				}
			} else {
				this.add_meta(fileinfo);
				this.add_other_info();
			}
			this.data.pop();
			_.forEach(this.data, function (item) {
				item.width = panel.calc_text_width(item.value);
				if (item.value != 'SECTION_HEADER') {
					this.properties_value_x = Math.max(this.properties_value_x, panel.calc_text_width(item.name) + 20);
				}
			}, this);
			if (fileinfo) fileinfo.Dispose();
			break;
		}
		this.count = this.data.length;
		this.offset = 0;
		this.index = 0;
		window.Repaint();
	}

	this.wheel = function (s) {
		if (this.containsXY(this.mx, this.my)) {
			if (this.count > this.rows) {
				var offset = this.offset - (s * 3);
				if (offset < 0) {
					offset = 0;
				}
				if (offset + this.rows > this.count) {
					offset = this.count - this.rows;
				}
				if (this.offset != offset) {
					this.offset = offset;
					window.RepaintRect(this.x, this.y, this.w, this.h);
				}
			}
			return true;
		}
		return false;
	}

	panel.list_objects.push(this);
	this.mode = mode;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.mx = 0;
	this.my = 0;
	this.index = 0;
	this.offset = 0;
	this.count = 0;
	this.clickable_text_x = 0;
	this.spacer_w = 0;
	this.artist = '';
	this.filename = '';
	this.filenames = {};
	this.up_btn = new _sb(chars.up, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset > 0; }, this), _.bind(function () { this.wheel(1); }, this));
	this.down_btn = new _sb(chars.down, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset < this.count - this.rows; }, this), _.bind(function () { this.wheel(-1); }, this));
	this.init();
}
