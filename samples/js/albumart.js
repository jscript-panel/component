function _albumart(x, y, w, h) {
	this.blur_it = function () {
		var blur_it = false;

		if (panel.display_objects.length) {
			var properties = panel.display_objects[0].properties;
			blur_it = properties.albumart.enabled && properties.albumart_blur.enabled;
		} else {
			blur_it = this.is_review_panel;
		}

		if (blur_it) {
			this.blur_img = this.img.Clone();
			this.blur_img.StackBlur(120);
		}
	}

	this.containsXY = function (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	this.key_down = function (k) {
		switch (k) {
		case VK_LEFT:
		case VK_UP:
			this.wheel(1);
			return true;
		case VK_RIGHT:
		case VK_DOWN:
			this.wheel(-1);
			return true;
		default:
			return false;
		}
	}

	this.lbtn_dblclk = function (x, y) {
		if (this.containsXY(x, y)) {
			if (panel.metadb) {
				switch (this.properties.double_click_mode.value) {
				case 0:
					if (panel.metadb.Path == this.path) {
						_explorer(this.path);
					} else if (utils.IsFile(this.path) || _.startsWith(this.path, 'http')) {
						utils.Run(this.path);
					}
					break;
				case 1:
					if (this.properties.mode.value == 0) {
						panel.metadb.ShowAlbumArtViewer(this.properties.id.value);
					}
					break;
				case 2:
					if (utils.IsFile(this.path)) _explorer(this.path);
					break;
				}
			}
			return true;
		}
		return false;
	}

	this.metadb_changed = function () {
		var img = null;

		if (panel.metadb) {
			if (this.properties.mode.value == 0) {
				img = panel.metadb.GetAlbumArt(this.properties.id.value);
			} else {
				_stringToArray(this.properties.edit.value, '\r\n').forEach(function (item) {
					if (img)
						return;

					switch (item) {
					case 'front_embedded':
						img = panel.metadb.GetAlbumArtEmbedded(0);
						break;
					case 'front_default':
						img = panel.metadb.GetAlbumArt(0, false);
						break;
					case 'front_stub':
						img = fb.GetAlbumArtStub(0);
						break;
					case 'back_embedded':
						img = panel.metadb.GetAlbumArtEmbedded(1);
						break;
					case 'back_default':
						img = panel.metadb.GetAlbumArt(1, false);
						break;
					case 'back_stub':
						img = fb.GetAlbumArtStub(1);
						break;
					case 'disc_embedded':
						img = panel.metadb.GetAlbumArtEmbedded(2);
						break;
					case 'disc_default':
						img = panel.metadb.GetAlbumArt(2, false);
						break;
					case 'disc_stub':
						img = fb.GetAlbumArtStub(2);
						break;
					case 'artist_embedded':
						img = panel.metadb.GetAlbumArtEmbedded(4);
						break;
					case 'artist_default':
						img = panel.metadb.GetAlbumArt(4, false);
						break;
					case 'artist_stub':
						img = fb.GetAlbumArtStub(4);
						break;

					// no stub or default
					case 'icon_embedded':
						img = panel.metadb.GetAlbumArtEmbedded(3);
						break;
					}
				});
			}
		}

		if (this.img) this.img.Dispose();
		if (this.blur_img) this.blur_img.Dispose();
		this.img = this.blur_img = null;
		this.tooltip = this.path = '';
		if (img) {
			this.img = img;
			this.blur_it();
			this.tooltip = 'Original dimensions: ' + this.img.Width + 'x' + this.img.Height + 'px';
			this.path = this.img.Path;
			if (this.path.length) {
				this.tooltip += '\nPath: ' + this.path;
			}
		}

		window.Repaint();
	}

	this.move = function (x, y) {
		this.mx = x;
		this.my = y;

		if (this.containsXY(x, y)) {
			if (this.img) {
				_tt(this.tooltip);
			}
			this.hover = true;
			return true;
		}

		if (this.hover) {
			_tt('');
		}
		this.hover = false;
		return false;
	}

	this.paint = function (gr) {
		_drawImage(gr, this.img, this.x, this.y, this.w, this.h, this.properties.aspect.value);
	}

	this.rbtn_up = function (x, y) {
		if (this.is_review_panel) {
			panel.m.AppendMenuItem(MF_STRING, 1600, 'Album Art left, Text right');
			panel.m.AppendMenuItem(MF_STRING, 1601, 'Album Art top, Text bottom');
			panel.m.CheckMenuRadioItem(1600, 1601, this.properties.layout.value + 1600);
			panel.m.AppendMenuSeparator();
		}

		panel.m.AppendMenuItem(MF_STRING, 1000, 'Refresh');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_GRAYED, 0, 'Mode');
		panel.m.AppendMenuItem(MF_STRING, 1100, 'Default');
		panel.m.AppendMenuItem(MF_STRING, 1101, 'Custom');
		panel.m.AppendMenuSeparator();
		panel.m.CheckMenuRadioItem(1100, 1101, this.properties.mode.value + 1100);

		if (this.properties.mode.value == 0) {
			this.ids.forEach(function (item, i) {
				panel.m.AppendMenuItem(MF_STRING, i + 1010, item);
			});
			panel.m.CheckMenuRadioItem(1010, 1014, this.properties.id.value + 1010);
		} else {
			panel.m.AppendMenuItem(MF_STRING, 1110, 'Edit...');
			panel.m.AppendMenuItem(MF_STRING, 1111, 'Help');
		}

		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_STRING, 1020, 'Crop (focus on centre)');
		panel.m.AppendMenuItem(MF_STRING, 1021, 'Crop (focus on top)');
		panel.m.AppendMenuItem(MF_STRING, 1022, 'Stretch');
		panel.m.AppendMenuItem(MF_STRING, 1023, 'Centre');
		panel.m.CheckMenuRadioItem(1020, 1023, this.properties.aspect.value + 1020);
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(EnableMenuIf(utils.IsFile(this.path)), 1030, 'Open containing folder');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(EnableMenuIf(panel.metadb), 1040, 'Google image search');
		panel.m.AppendMenuSeparator();
		panel.s10.AppendMenuItem(MF_STRING, 1050, 'Opens image in external viewer');
		panel.s10.AppendMenuItem(MF_STRING, 1051, 'Opens image using fb2k viewer');
		panel.s10.AppendMenuItem(MF_STRING, 1052, 'Opens containing folder');
		panel.s10.CheckMenuRadioItem(1050, 1052, this.properties.double_click_mode.value + 1050);
		panel.s10.AppendTo(panel.m, MF_STRING, 'Double click');
		panel.m.AppendMenuSeparator();
	}

	this.rbtn_up_done = function (idx) {
		switch (idx) {
		case 1000:
			this.metadb_changed();
			break;
		case 1010:
		case 1011:
		case 1012:
		case 1013:
		case 1014:
			this.properties.id.value = idx - 1010;
			this.metadb_changed();
			break;
		case 1020:
		case 1021:
		case 1022:
		case 1023:
			this.properties.aspect.value = idx - 1020;
			window.RepaintRect(this.x, this.y, this.w, this.h);
			break;
		case 1030:
			_explorer(this.path);
			break;
		case 1040:
			utils.Run('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(panel.tf('%album artist%[ %album%]')));
			break;
		case 1050:
		case 1051:
		case 1052:
			this.properties.double_click_mode.value = idx - 1050;
			break;
		case 1100:
		case 1101:
			this.properties.mode.value = idx - 1100;
			this.metadb_changed();
			break;
		case 1110:
			try {
				var tmp = utils.TextBox('Enter image types here. Each one will checked in order until a valid image is found. See Help.', window.Name, this.properties.edit.value);
				if (tmp != this.properties.edit.value) {
					this.properties.edit.value = tmp;
					this.metadb_changed();
				}
			} catch (e) {}
			break;
		case 1111:
			utils.ShowPopupMessage(this.help_text, window.Name);
			break;
		case 1600:
		case 1601:
			this.properties.layout.value = idx - 1600;
			on_size();
			window.Repaint();
			break;
		}
	}

	this.wheel = function (s) {
		if (this.properties.mode.value == 0 && this.containsXY(this.mx, this.my)) {
			var id = this.properties.id.value - s;
			if (id < 0) {
				id = 4;
			}
			if (id > 4) {
				id = 0;
			}
			this.properties.id.value = id;
			_tt('');
			this.metadb_changed();
			return true;
		}
		return false;
	}

	this.is_review_panel = panel.text_objects.length == 1 && panel.text_objects[0].mode == 'allmusic';

	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.mx = 0;
	this.my = 0;
	this.tooltip = '';
	this.img = null;
	this.blur_img = null;
	this.image_index = 0;
	this.path = null;
	this.hover = false;
	this.ids = ['Front', 'Back', 'Disc', 'Icon', 'Artist'];
	this.help_text = utils.ReadUTF8(fb.ComponentPath + 'samples\\text\\albumart_help');
	this.properties = {
		aspect : new _p('2K3.ARTREADER.ASPECT', image.centre),
		id : new _p('2K3.ARTREADER.ID', 0),
		double_click_mode : new _p('2K3.ARTREADER.DOUBLE.CLICK.MODE', 1), // 0 external viewer 1 fb2k viewer 2 explorer
		mode : new _p('2K3.ARTREADER.MODE', 0), // 0 default, 1 custom
		edit : new _p('2K3.ARTREADER.EDIT', 'front_default\r\ndisc_default\r\nartist_default\r\nfront_stub\r\n'),
	};

	if (this.is_review_panel) {
		this.properties.layout = new _p('2K3.ARTREADER.LAYOUT', 0); // 0 horizontal, 1 vertical
		this.properties.ratio = new _p('2K3.ARTREADER.RATIO', 0.5);
	}
}
