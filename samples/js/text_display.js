window.SetProperty('2K3.ARTREADER.ID', 0);

function _text_display(x, y, w, h) {
	this.size = function () {
		this.text_height = 0;
		this.ha = this.h - _scale(24);
		this.up_btn.x = this.x + Math.round((this.w - _scale(12)) / 2);
		this.down_btn.x = this.up_btn.x;
		this.up_btn.y = this.y;
		this.down_btn.y = this.y + this.h - _scale(12);
		this.scroll_step = _scale(panel.fonts.size.value) * 4;

		if (this.text_layout) {
			this.text_height = this.text_layout.CalcTextHeight(this.w);
			if (this.text_height < this.ha) this.offset = 0;
			else if (this.offset < this.ha - this.text_height) this.offset = this.ha - this.text_height;
		}
	}

	this.paint = function (gr) {
		if (this.properties.albumart.enabled) {
			_drawImage(gr, albumart.img, 0, 0, panel.w, panel.h, image.crop);
			_drawOverlay(gr, 0, 0, panel.w, panel.h, 200);
		}

		if (!this.text_layout) return;
		gr.WriteTextLayout(this.text_layout, this.colour_string, this.x, this.y + _scale(12), this.w, this.ha, this.offset);
		this.up_btn.paint(gr, this.default_colour);
		this.down_btn.paint(gr, this.default_colour);
	}

	this.playback_time = function () {
		if (this.properties.per_second.enabled) {
			this.refresh();
		}
	}

	this.metadb_changed = function () {
		this.refresh();
	}

	this.refresh = function (force) {
		this.default_colour = this.properties.albumart.enabled ? RGB(240, 240, 240) : panel.colours.text;

		if (panel.metadb) {
			var tmp = '';

			if (!panel.tfo[this.properties.text_tf.value]) {
				panel.tfo[this.properties.text_tf.value] = fb.TitleFormat(this.properties.text_tf.value);
			}

			if (panel.selection.value == 0 && fb.IsPlaying) {
				var loc = plman.GetPlayingItemLocation();
				if (loc.IsValid) {
					tmp = panel.tfo[this.properties.text_tf.value].EvalPlaylistItem(loc.PlaylistIndex, loc.PlaylistItemIndex);
				} else {
					tmp = panel.tf(this.properties.text_tf.value);
				}
			} else {
				var PlaylistIndex = plman.ActivePlaylist;
				var PlaylistItemIndex = plman.GetPlaylistFocusItemIndex(PlaylistIndex);
				if (PlaylistItemIndex > -1) {
					tmp = panel.tfo[this.properties.text_tf.value].EvalPlaylistItem(PlaylistIndex, PlaylistItemIndex);
				} else {
					tmp = panel.tf(this.properties.text_tf.value);
				}
			}

			if (force || tmp != this.text) {
				this.clear_layout()
				this.text = tmp;
				if (this.text.length) {
					var font_obj = JSON.parse(panel.fonts.normal);
					var font_styles = GetFontStyles(this.text, font_obj);
					var colour_styles = GetColourStyles(this.text, this.default_colour);
					this.colour_string = JSON.stringify(colour_styles);
					this.text_layout = utils.CreateTextLayout2(StripCodes(this.text), JSON.stringify(font_styles), this.properties.halign.value, this.properties.valign.value);
				}
			}
		} else {
			this.clear_layout();
		}
		this.size();
		window.Repaint();
	}

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
		panel.m.AppendMenuItem(MF_STRING, 1200, 'Custom text...');
		panel.m.AppendMenuItem(CheckMenuIf(this.properties.per_second.enabled), 1201, 'Per-second updates');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_STRING, 1202, 'Custom colours and fonts explained');
		panel.m.AppendMenuSeparator();
		panel.s10.AppendMenuItem(MF_STRING, 1210, 'Left');
		panel.s10.AppendMenuItem(MF_STRING, 1211, 'Right');
		panel.s10.AppendMenuItem(MF_STRING, 1212, 'Centre');
		panel.s10.CheckMenuRadioItem(1210, 1212, this.properties.halign.value + 1210);
		panel.s10.AppendTo(panel.m, MF_STRING, 'Horizontal alignment');
		panel.s11.AppendMenuItem(MF_STRING, 1220, 'Top');
		panel.s11.AppendMenuItem(MF_STRING, 1221, 'Bottom');
		panel.s11.AppendMenuItem(MF_STRING, 1222, 'Centre');
		panel.s11.CheckMenuRadioItem(1220, 1222, this.properties.valign.value + 1220);
		panel.s11.AppendTo(panel.m, MF_STRING, 'Vertical alignment');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(CheckMenuIf(this.properties.albumart.enabled), 1230, 'Album art background');
		panel.m.AppendMenuSeparator();
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
			utils.Run('https://jscript-panel.github.io/gallery/text-display/#title-formatting');
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
		case 1230:
			this.properties.albumart.toggle();
			this.refresh(true);
			break;
		}
	}

	panel.display_objects.push(this);
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.ha = h - _scale(24); // height adjusted for up/down buttons
	this.default_colour = 0;
	this.colour_string = '';
	this.text_layout = null;
	this.text_height = 0;
	this.scroll_step = 0;
	this.mx = 0;
	this.my = 0;
	this.offset = 0;
	this.text = '';
	this.up_btn = new _sb(chars.up, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset < 0; }, this), _.bind(function () { this.wheel(1); }, this));
	this.down_btn = new _sb(chars.down, this.x, this.y, _scale(12), _scale(12), _.bind(function () { return this.offset > this.ha - this.text_height; }, this), _.bind(function () { this.wheel(-1); }, this));

	this.properties = {
		text_tf : new _p('2K3.TEXT.DISPLAY.TF', '%artist%$crlf()\r\n%title%$crlf()\r\n[%album%[ - %date%]]'),
		halign : new _p('2K3.TEXT.HALIGN', 2),
		valign : new _p('2K3.TEXT.VALIGN', 2),
		per_second : new _p('2K3.TEXT.PER.SECOND', false),
		albumart : new _p('2K3.TEXT.ALBUMART', false),
	}
}
