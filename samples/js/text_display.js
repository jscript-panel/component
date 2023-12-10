window.SetProperty('2K3.ARTREADER.ID', 0);

function _text_display(x, y, w, h) {
	this.clear_layout = function () {
		if (this.text_layout) {
			this.text_layout.Dispose();
			this.text_layout = null;
		}
		this.text = '';
	}

	this.containsXY = function (x, y) {
		return x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
	}

	this.lbtn_up = function (x, y) {
		return this.containsXY(x, y);
	}

	this.metadb_changed = function () {
		this.refresh();
	}

	this.move = function (x, y) {
		this.mx = x;
		this.my = y;
		window.SetCursor(IDC_ARROW);
		return this.containsXY(x, y);
	}

	this.playback_time = function () {
		if (this.properties.per_second.enabled) {
			this.refresh();
		}
	}

	this.paint = function (gr) {
		if (this.properties.albumart.enabled) {
			_drawImage(gr, this.properties.albumart_blur.enabled ? albumart.blur_img : albumart.img, 0, 0, panel.w, panel.h, image.crop);
			_drawOverlay(gr, 0, 0, panel.w, panel.h, 120);
		}

		if (this.properties.layout.value > 0) {
			_drawImage(gr, albumart.img, albumart.x, albumart.y, albumart.w, albumart.h, image.centre);
		}

		if (!this.text_layout) return;
		gr.WriteTextLayout(this.text_layout, this.colour_string, this.x, this.y, this.w, this.h, this.offset);
	}

	this.rbtn_up = function (x, y) {
		panel.m.AppendMenuItem(MF_STRING, 1200, 'Custom text...');
		panel.m.AppendMenuItem(CheckMenuIf(this.properties.per_second.enabled), 1201, 'Per-second updates');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_STRING, 1202, 'Custom colours and fonts explained');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_GRAYED, 1203, 'Layout');
		panel.m.AppendMenuItem(MF_STRING, 1204, 'Text only');
		panel.m.AppendMenuItem(MF_STRING, 1205, 'Album Art top, Text bottom');
		panel.m.AppendMenuItem(MF_STRING, 1206, 'Album Art left, Text right');
		panel.m.CheckMenuRadioItem(1204, 1206, this.properties.layout.value + 1204);
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(CheckMenuIf(this.properties.albumart.enabled), 1207, 'Album art background');
		panel.m.AppendMenuItem(GetMenuFlags(this.properties.albumart.enabled, this.properties.albumart_blur.enabled), 1208, 'Enable blur effect');
		panel.m.AppendMenuSeparator();
		if (this.properties.layout.value != 1) {
			panel.s10.AppendMenuItem(MF_STRING, 1210, 'Left');
			panel.s10.AppendMenuItem(MF_STRING, 1211, 'Right');
			panel.s10.AppendMenuItem(MF_STRING, 1212, 'Centre');
			panel.s10.CheckMenuRadioItem(1210, 1212, this.properties.halign.value + 1210);
			panel.s10.AppendTo(panel.m, MF_STRING, 'Text alignment (horizontal)');
			panel.s11.AppendMenuItem(MF_STRING, 1220, 'Top');
			panel.s11.AppendMenuItem(MF_STRING, 1221, 'Bottom');
			panel.s11.AppendMenuItem(MF_STRING, 1222, 'Centre');
			panel.s11.CheckMenuRadioItem(1220, 1222, this.properties.valign.value + 1220);
			panel.s11.AppendTo(panel.m, MF_STRING, 'Text alignment (vertical)');
			panel.m.AppendMenuSeparator();
		}
	}

	this.rbtn_up_done = function (idx) {
		switch (idx) {
		case 1200:
			try {
				var tmp = utils.TextBox('You can use full title formatting here. Custom colours and fonts are supported', window.Name, this.properties.text_tf.value);
				if (tmp != this.properties.text_tf.value) {
					this.properties.text_tf.value = tmp;
					this.refresh();
				}
			} catch (e) {}
			break;
		case 1201:
			this.properties.per_second.toggle();
			break;
		case 1202:
			utils.Run('https://jscript-panel.github.io/docs/font-rgb/');
			break;
		case 1204:
		case 1205:
		case 1206:
			this.properties.layout.value = idx - 1204;
			this.refresh(true);
			break;
		case 1207:
			this.properties.albumart.toggle();
			if (this.properties.albumart.enabled) {
				albumart.metadb_changed();
			}
			this.refresh(true);
			break;
		case 1208:
			this.properties.albumart_blur.toggle();
			albumart.metadb_changed();
			break;
		case 1210:
		case 1211:
		case 1212:
			this.properties.halign.value = idx - 1210;
			this.refresh(true);
			break;
		case 1220:
		case 1221:
		case 1222:
			this.properties.valign.value = idx - 1220;
			this.refresh(true);
			break;
		}
	}

	this.refresh = function (force) {
		this.default_colour = this.properties.albumart.enabled ? RGB(240, 240, 240) : panel.colours.text;

		if (panel.metadb) {
			var tmp = '';

			if (!panel.tfo[this.properties.text_tf.value]) {
				panel.tfo[this.properties.text_tf.value] = fb.TitleFormat(this.properties.text_tf.value);
			}
			var tfo = panel.tfo[this.properties.text_tf.value];

			if (panel.selection.value == 0 && fb.IsPlaying) {
				var loc = plman.GetPlayingItemLocation();
				if (loc.IsValid) {
					tmp = tfo.EvalPlaylistItem(loc.PlaylistIndex, loc.PlaylistItemIndex);
				} else {
					tmp = tfo.Eval();
				}
			} else {
				var PlaylistIndex = plman.ActivePlaylist;
				var PlaylistItemIndex = plman.GetPlaylistFocusItemIndex(PlaylistIndex);
				tmp = tfo.EvalPlaylistItem(PlaylistIndex, PlaylistItemIndex);
			}

			if (force || tmp != this.text) {
				this.clear_layout()
				this.text = tmp;
				if (this.text.length) {
					var font_obj = JSON.parse(panel.fonts.normal);
					var font_styles = GetFontStyles(this.text, font_obj);
					var colour_styles = GetColourStyles(this.text, this.default_colour);
					this.colour_string = JSON.stringify(colour_styles);
					if (this.properties.layout.value == 1) {
						this.text_layout = utils.CreateTextLayout2(StripCodes(this.text), JSON.stringify(font_styles), 2, 2);
					} else {
						this.text_layout = utils.CreateTextLayout2(StripCodes(this.text), JSON.stringify(font_styles), this.properties.halign.value, this.properties.valign.value);
					}
				}
			}
		} else {
			this.clear_layout();
		}
		this.size();
		window.Repaint();
	}

	this.size = function () {
		this.text_height = 0;
		var margin = _scale(12);

		switch (this.properties.layout.value) {
		case 0:
			this.x = margin;
			this.y = 0;
			this.w = panel.w - (margin * 2);
			this.h = panel.h;
			if (this.text_layout) this.text_height = this.text_layout.CalcTextHeight(this.w);
			break;
		case 1:
			this.x = margin;
			this.w = panel.w - (margin * 2);
			if (this.text_layout) this.text_height = this.text_layout.CalcTextHeight(this.w);
			this.y = panel.h - this.text_height - (margin * 2);
			this.h = this.text_height + (margin * 2);
			albumart.x = margin;
			albumart.y = margin;
			albumart.w = panel.w - (margin * 2);
			albumart.h = panel.h - this.h - margin;
			break;
		case 2:
			albumart.x = margin;
			albumart.y = margin;
			albumart.w = (panel.w / 2) - margin;
			albumart.h = panel.h - (margin * 2);
			this.x = (margin * 2) + albumart.w;
			this.y = margin;
			this.w = albumart.w - margin;
			this.h = panel.h - (margin * 2);
			if (this.text_layout) this.text_height = this.text_layout.CalcTextHeight(this.w);
			break;
		}

		if (this.text_height < this.h) this.offset = 0;
		else if (this.offset < this.h - this.text_height) this.offset = this.h - this.text_height;

		this.scroll_step = _scale(panel.fonts.size.value) * 4;
	}

	this.wheel = function (s) {
		if (this.containsXY(this.mx, this.my)) {
			if (this.text_height > this.h) {
				this.offset += s * this.scroll_step;
				if (this.offset > 0) this.offset = 0;
				else if (this.offset < this.h - this.text_height) this.offset = this.h - this.text_height;
				window.RepaintRect(this.x, this.y, this.w, this.h);
			}
			return true;
		}
		return false;
	}

	panel.display_objects.push(this);
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.default_colour = 0;
	this.colour_string = '';
	this.text_layout = null;
	this.text_height = 0;
	this.scroll_step = 0;
	this.mx = 0;
	this.my = 0;
	this.offset = 0;
	this.text = '';

	this.properties = {
		text_tf : new _p('2K3.TEXT.DISPLAY.TF', '$font(Segoe UI,24,700)\r\n[%title%$crlf()]\r\n$font(Segoe UI,18)\r\n[%artist%$crlf()]\r\n$font(Segoe UI,14)\r\n[%album% \'(\'%date%\')\'$crlf()]\r\n$font(Segoe UI,10)\r\n[%__bitrate% kbps %codec% [%codec_profile% ][%__tool% ][%__tagtype%]]'),
		halign : new _p('2K3.TEXT.HALIGN', 2),
		valign : new _p('2K3.TEXT.VALIGN', 2),
		per_second : new _p('2K3.TEXT.PER.SECOND', false),
		albumart : new _p('2K3.TEXT.ALBUMART', true),
		albumart_blur : new _p('2K3.TEXT.ALBUMART.BLUR', true),
		layout : new _p('2K3.TEXT.LAYOUT', 0), // 0 text only, 1 album art top text bottom 2 album art left text right
	}
}
