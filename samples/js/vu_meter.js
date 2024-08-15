var font_t = CreateFontString("Segoe UI", 8);
var colour_mode = window.GetProperty("2K3.METER.COLOUR.MODE", 1); // 0 UI, 1 Rainbow
var meter_style = window.GetProperty("2K3.METER.STYLE", 0); // 0: smooth, 1: blocks-by-dB
var rms_block_db2 = window.GetProperty("2K3.METER.BLOCK.DB", 0.625);
var rms_3db2 = window.GetProperty("2K3.METER.AES", false);

// blocks by count style has been removed
if (meter_style > 1) {
	meter_style = 1;
	window.SetProperty("2K3.METER.STYLE", meter_style);
}

var solid_colour = false;
var rms_block_dbs = [0.625, 1.25, 2.5];
var RMS_levels = [], Peak_levels = [], Peak_falldown = [];
var ch_count = 2; //prevent script error on init with nothing playing and empty playlist
var ch_config = 0;
var ww = 0, wh = 0;
var timer_id = 0;
var rms_db_offset = 0;
var dBrange = 0;

var rainbow_stops = [
	[ 1.0, RGB(227, 9, 64) ],
	[ 0.66, RGB(231, 215, 2) ],
	[ 0.33, RGB(15, 168, 149) ],
	[ 0.0, RGB(19, 115, 232) ]
];

var brush = {
	Stops : [],
	Start : [0, 0], // x and y values
	End : [0, 0], // x and y values
};

var colours = {
	text : 0,
	highlight : 0,
	background : 0,
	bar : 0,
};

var ChannelNames = [ "FL", "FR", "FC", "LFE", "BL", "BR", "FCL", "FCR", "BC", "SL", "SR", "TC", "TFL", "TFC", "TFR", "TBL", "TBC", "TBR" ];

function init() {
	dBrange = maxDB - minDB

	update_rms_offset();
	update_colours();

	if (fb.IsPlaying) start_timer();
	else get_initial_track_info();
}

function update_rms_offset() {
	if (rms_3db2) {
		rms_db_offset = 20 * Math.log(Math.sqrt(2)) / Math.LN10; // 3.01029995663981 dB
	} else {
		rms_db_offset = 0;
	}
}

function update_colours() {
	if (window.IsDefaultUI) {
		colours.text = window.GetColourDUI(ColourTypeDUI.text);
		colours.highlight = window.GetColourDUI(ColourTypeDUI.highlight);
		colours.background = window.GetColourDUI(ColourTypeDUI.background);
	} else {
		colours.text = window.GetColourCUI(ColourTypeCUI.text);
		colours.highlight = window.GetColourCUI(ColourTypeCUI.text);
		colours.background = window.GetColourCUI(ColourTypeCUI.background);
	}

	if (colour_mode == 0) {
		solid_colour = colours.text == colours.highlight;

		if (solid_colour) {
			colours.bar = colours.text;
		} else {
			brush.Stops = [
				[0.0, colours.text],
				[1.0, colours.highlight],
			]
			colours.bar = JSON.stringify(brush);
		}
	} else {
		solid_colour = false;
		brush.Stops = rainbow_stops;
		colours.bar = JSON.stringify(brush);
	}
}

function clear_graph() {
	for (var c = 0; c < ch_count; ++c) {
		RMS_levels[c] = 0;
		Peak_levels[c] = 0;
		Peak_falldown[c] = 0;
	}
	window.Repaint();
}

function update_graph() {
	var cur_time = fb.PlaybackTime;
	if (cur_time > rms_window) {
		var chunk = fb.GetAudioChunk(rms_window);
		if (chunk) {
			ch_count = chunk.ChannelCount;
			ch_config = chunk.ChannelConfig;
			var data = chunk.Data.toArray();
			var frame_len = chunk.SampleCount;
			if (data && ch_count > 0 && frame_len > 0) {
				var old_count = Peak_levels.length;
				RMS_levels.length = ch_count;
				Peak_levels.length = ch_count;
				Peak_falldown.length = ch_count;
				if (old_count < ch_count) {
					for (var c = old_count; c < ch_count; ++c) {
						Peak_levels[c] = 0;
						Peak_falldown[c] = 0;
					}
				}
				for (var c = 0; c < ch_count; ++c) {
					var sum = 0, peak = 0;
					for (var i = c; i < data.length; i += ch_count) {
						var s = Math.abs(data[i]);
						if (s > peak) peak = s;
						sum += s * s;
					}
					RMS_levels[c] = Math.sqrt(sum/frame_len);
					if (peak >= Peak_levels[c]) {
						Peak_levels[c] = peak;
						Peak_falldown[c] = 0;
					} else {
						if (++Peak_falldown[c] > peak_hold) Peak_levels[c] *= peak_fall_mul;
					}
				}
				window.Repaint();
			}
		}
	}
}

function to_db(num) {
	return 20 * Math.log(num) / Math.LN10;
}

function clamp(value, min, max) {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function start_timer() {
	if (!timer_id) {
		timer_id = window.SetInterval(update_graph, timer_interval);
	}
}

function stop_timer() {
	if (timer_id) {
		window.ClearInterval(timer_id);
	}

	timer_id = 0;
}

function get_initial_track_info() {
	var handle = fb.GetFocusItem();
	if (!handle) return;

	var info = handle.GetFileInfo();
	var idx_ch_count = info.InfoFind("channels");
	var idx_ch_config = info.InfoFind("WAVEFORMATEXTENSIBLE_CHANNEL_MASK");
	if (idx_ch_count >= 0) {
		ch_count = Number(info.InfoValue(idx_ch_count));
	}
	if (idx_ch_config >= 0) {
		ch_config = Number(info.InfoValue(idx_ch_config));
	}

	info.Dispose();
	handle.Dispose();
}

function on_colours_changed() {
	update_colours();
	window.Repaint();
}

function channel_name(ch) {
	if (ch < ChannelNames.length) {
		if (ch_config) {
			for (var i = 0, idx = 0; i < ChannelNames.length; ++i) {
				if (ch_config & (1 << i)) {
					if (idx == ch) return ChannelNames[i];
					idx++;
				}
			}
		} else {
			return ChannelNames[ch];
		}
	}

	var name = "Ch" + (ch+1).toString();
	return name;
}

function on_mouse_rbtn_up(x, y) {
	var menu = window.CreatePopupMenu();
	var colour_menu = window.CreatePopupMenu();
	var style_menu = window.CreatePopupMenu();

	colour_menu.AppendMenuItem(MF_STRING, 1, 'UI');
	colour_menu.AppendMenuItem(MF_STRING, 2, 'Rainbow');
	colour_menu.CheckMenuRadioItem(1, 2, colour_mode + 1);
	colour_menu.AppendTo(menu, MF_STRING, 'Bar colours');
	style_menu.AppendMenuItem(MF_STRING, 3, 'Smooth');
	style_menu.AppendMenuItem(MF_STRING, 4, 'Blocks');
	style_menu.CheckMenuRadioItem(3, 4, meter_style + 3);

	if (meter_style == 1) {
		style_menu.AppendMenuSeparator();
		style_menu.AppendMenuItem(MF_GRAYED, 4, 'Block width (db)');
		rms_block_dbs.forEach(function (item, index) {
			style_menu.AppendMenuItem(MF_STRING, 20 + index, item);
		});
		var rms_block_db_index = rms_block_dbs.indexOf(rms_block_db2);
		style_menu.CheckMenuRadioItem(20, 20 + rms_block_dbs.length, 20 + rms_block_db_index);
	}

	style_menu.AppendTo(menu, MF_STRING, 'Meter style');

	menu.AppendMenuSeparator();
	menu.AppendMenuItem(CheckMenuIf(rms_3db2), 30, 'Use AES +3dB RMS');
	menu.AppendMenuSeparator();
	menu.AppendMenuItem(MF_STRING, 10, 'Configure...');

	var idx = menu.TrackPopupMenu(x, y);
	menu.Dispose();
	colour_menu.Dispose();
	style_menu.Dispose();

	switch (idx) {
	case 0:
		break;
	case 1:
	case 2:
		colour_mode = idx -1;
		window.SetProperty("2K3.METER.COLOUR.MODE", colour_mode);
		update_colours();
		window.Repaint();
		break;
	case 3:
	case 4:
	case 5:
		meter_style = idx -3;
		window.SetProperty("2K3.METER.STYLE", meter_style);
		window.Repaint();
		break;
	case 10:
		window.ShowConfigure();
		break;
	case 20:
	case 21:
	case 22:
		rms_block_db2 = rms_block_dbs[idx - 20];
		window.SetProperty("2K3.METER.BLOCK.DB", rms_block_db2);
		window.Repaint();
		break;
	case 30:
		rms_3db2 = !rms_3db2;
		window.SetProperty("2K3.METER.AES", rms_3db2);
		update_rms_offset();
		window.Repaint();
		break;
	}

	return true;
}

function on_paint(gr) {
	gr.Clear(colours.background);
	if (wh < 1 || ww < 1) return;

	var hide_ch_labels = false;
	var hide_db_labels = false;
	var bar_pad_left = 3*8;
	var bar_pad_right = 3*8;
	var bar_pad_top = 5;
	var bar_pad_bottom = 30;
	var bar_height = 0;
	var bar_width = 0;

	bar_height = Math.floor((wh - bar_pad_top - bar_pad_bottom) / ch_count);

	// bars are too thin for channel labels, hide them
	if (bar_height < 8) {
		hide_ch_labels = true;
	}

	// bars are too thin for dB scale too
	if (bar_height < 4) {
		hide_ch_labels = true;
		hide_db_labels = true;
		bar_pad_top = 0;
		bar_pad_bottom = 0;
		bar_pad_left = 0;
		bar_pad_right = 0;
		bar_height = Math.floor(wh / ch_count);
	}

	// bars won't fit in the window, downmix to mono
	if (bar_height < 2 || bar_height * ch_count > wh) {
		var rms_sum = 0;
		var peak_sum = 0;
		for (var c = 0; c < ch_count; ++c) {
			rms_sum += RMS_levels[c] * RMS_levels[c];
			peak_sum += Peak_levels[c];
		}
		RMS_levels[0] = Math.sqrt(rms_sum/ch_count);
		Peak_levels[0] = peak_sum/ch_count;
		ch_count = 1;
		hide_ch_labels = true;
		hide_db_labels = true;
		bar_pad_top = 0;
		bar_pad_bottom = 0;
		bar_pad_left = 0;
		bar_pad_right = 0;
		bar_height = Math.floor(wh / ch_count);
	}

	bar_width = ww - bar_pad_left - bar_pad_right;

	if (bar_width != brush.End[0]) {
		brush.End[0] = bar_width;

		if (!solid_colour) {
			colours.bar = JSON.stringify(brush);
		}
	}

	// labels
	if (!hide_db_labels) {
		var db_spacing = 5;
		if (dBrange < db_spacing) db_spacing = 1;
		if (ww * db_spacing / dBrange < 10*8) {
			db_spacing = ((10*8 * dBrange) / ww);
			db_spacing -= (db_spacing % 5);
		}

		var y = bar_pad_top + (bar_height * ch_count) + 5;
		gr.FillRectangle(bar_pad_left, y, bar_width, 1, colours.text);

		for (var i = minDB, j = 0; i <= maxDB; i += db_spacing, j++) {
			var x = bar_pad_left + (bar_width * j / (dBrange / db_spacing));
			gr.WriteTextSimple(i + "dB", font_t, colours.text, x - (bar_pad_left / 2), wh - 20, ww, wh);
			gr.DrawLine(x, y - 2, x, y + 2, 1, colours.text);
		}
	}

	if (!hide_ch_labels) {
		for (var c = 0; c < ch_count; ++c) {
			gr.WriteTextSimple(channel_name(c), font_t, colours.text, 4, bar_pad_top + (bar_height * c) + bar_height / 2 - 8, ww, wh);
		}
	}

	// bars
	if (meter_style == 1) {
		var block_count = Math.max(Math.floor(dBrange / rms_block_db2), 1);
		var block_width = bar_width / block_count;
		var block_pad = Math.max(Math.ceil(block_width * 0.05), 1);
	}

	for (var c = 0; c < ch_count; ++c) {
		if (RMS_levels[c]) {
			var rms_db = clamp(to_db(RMS_levels[c]) + rms_db_offset, minDB, maxDB);

			if (meter_style == 0) { // smooth mode
				var width = Math.round(bar_width * (rms_db - minDB) / dBrange);
				gr.FillRectangle(bar_pad_left, bar_pad_top + (bar_height * c), width, bar_height - 1, colours.bar);
			} else { // block mode
				var blocks = Math.round(block_count * (rms_db - minDB) / dBrange);
				var width = blocks * block_width;
				gr.FillRectangle(bar_pad_left, bar_pad_top + (bar_height * c), width, bar_height - 1, colours.bar);

				for (var i = 1; i < blocks; ++i) {
					gr.FillRectangle(bar_pad_left - Math.ceil(block_pad / 2) + (i * block_width), bar_pad_top + (bar_height * c), block_pad, bar_height - 1, colours.background);
				}
			}
		}

		if (peak_bar_width > 0 && Peak_levels[c] > 0) {
			var peak_db = clamp(to_db(Peak_levels[c]), minDB, maxDB);
			if (peak_db > minDB) {
				var peak_pos = Math.round(bar_width * (peak_db - minDB) / dBrange);
				gr.FillRectangle(bar_pad_left + peak_pos - peak_bar_width / 2, bar_pad_top + (bar_height * c), peak_bar_width, bar_height - 1, colours.bar);
			}
		}
	}
}

function on_playback_new_track(handle) {
	start_timer();
}

function on_playback_pause(state) {
	state ? stop_timer() : start_timer();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		stop_timer();
	}
	clear_graph();
}

function on_size() {
	ww = window.Width;
	wh = window.Height;
}
