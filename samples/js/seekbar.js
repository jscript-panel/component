function _seekbar(x, y, w, h, spectrogram_mode) {
	this.item_focus_change = function () {
		if (!this.spectrogram_mode || fb.IsPlaying) return;
		this.clear_image();
		this.image = this.get_image(fb.GetFocusItem());
		window.Repaint();
	}

	this.paint = function (gr) {
		if (!this.spectrogram_mode) return;

		if (this.working) {
			gr.WriteText(chars.hourglass, JSON.stringify({Name:'FontAwesome',Size:this.h - _scale(16)}), this.properties.marker_colour.value, this.x, this.y, this.w, this.h, 2, 2);
		} else if (this.image) {
			_drawImage(gr, this.image, this.x, this.y, this.w, this.h, image.stretch);
		}
		if (fb.IsPlaying && fb.PlaybackLength > 0) {
			gr.FillRectangle(this.x + this.pos() - 2, this.y, 2, this.h, this.properties.marker_colour.value);
		}
	}

	this.playback_new_track = function (metadb) {
		if (!this.spectrogram_mode) return;
		this.clear_image();

		if (metadb) {
			this.image = this.get_image(metadb);
			if (!this.image) {
				switch(true) {
				case utils.IsFile(this.filename):
					console.log(N, 'Skipping... a cached file appears to exist but it was not recognised as a valid image.');
					break;
				case !utils.IsFile(ffmpeg_exe):
					console.log(N, 'Skipping... ffmpeg.exe was not found. Check the path set in the script.');
					break;
				case !utils.IsFolder(spectrogram_cache):
					console.log(N, 'Skipping... spectrogram_cache folder was not found. Check the path set in the script.');
					break;
				case !utils.IsFile(metadb.Path):
					console.log(N, 'Skipping... Playing item not supported.');
					break;
				case fb.PlaybackLength <= 0:
					console.log(N, 'Skipping... Unknown length.');
					break;
				case fb.PlaybackLength > 3600: // ffmpeg itself can decode larger files but the showspectrumpic option is problematic
					console.log(N, 'Skipping... Length too long.');
					break;
				case this.tfo.cue.Eval() == 'cue':
					console.log(N, 'Skipping... Cannot support cuesheets.');
					break;
				case metadb.SubSong > 0:
					console.log(N, 'Skipping... Cannot support tracks with chapters.');
					break;
				case this.properties.library_only.enabled && !metadb.IsInLibrary():
					console.log(N, 'Skipping... Track not in library.');
					break;
				default:
					this.generate_image(metadb);
					break;
				}
			}
		}
		window.Repaint();
	}

	this.playback_seek = function () {
		this.repaint_rect();
	}

	this.playback_stop = function (reason) {
		if (this.spectrogram_mode && reason != 2) {
			this.item_focus_change();
		} else {
			this.playback_seek();
		}
	}

	this.containsXY = function (x, y) {
		var m = this.drag ? 200 : 0;
		return x > this.x - m && x < this.x + this.w + (m * 2) && y > this.y - m && y < this.y + this.h + (m * 2);
	}

	this.wheel = function (s) {
		if (this.containsXY(this.mx, this.my)) {
			switch (true) {
			case !fb.IsPlaying:
			case fb.PlaybackLength <= 0:
				break;
			case fb.PlaybackLength < 60:
				fb.PlaybackTime += s * 5;
				break;
			case fb.PlaybackLength < 600:
				fb.PlaybackTime += s * 10;
				break;
			default:
				fb.PlaybackTime += s * 60;
				break;
			}
			_tt('');
			return true;
		}
		return false;
	}

	this.move = function (x, y) {
		this.mx = x;
		this.my = y;
		if (this.containsXY(x, y)) {
			if (fb.IsPlaying && fb.PlaybackLength > 0) {
				x -= this.x;
				this.drag_seek = x < 0 ? 0 : x > this.w ? 1 : x / this.w;
				_tt(utils.FormatDuration(fb.PlaybackLength * this.drag_seek));
				if (this.drag) {
					this.playback_seek();
				}
			}
			this.hover = true;
			return true;
		}

		if (this.hover) {
			_tt('');
		}
		this.hover = false;
		this.drag = false;
		return false;
	}

	this.lbtn_down = function (x, y) {
		if (this.containsXY(x, y)) {
			if (fb.IsPlaying && fb.PlaybackLength > 0) {
				this.drag = true;
			}
			return true;
		}
		return false;
	}

	this.lbtn_up = function (x, y) {
		if (this.containsXY(x, y)) {
			if (this.drag) {
				this.drag = false;
				fb.PlaybackTime = fb.PlaybackLength * this.drag_seek;
			}
			return true;
		}
		return false;
	}

	this.rbtn_up = function (x, y) {
		var size = 0;
		utils.ListFiles(spectrogram_cache).toArray().forEach(function (item) {
			size += utils.GetFileSize(item);
		});

		panel.m.AppendMenuItem(MF_STRING, 1000, 'FFmpeg showspectrumpic options...');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(MF_STRING, 1001, 'Marker colour...');
		panel.m.AppendMenuSeparator();
		panel.m.AppendMenuItem(CheckMenuIf(this.properties.library_only.enabled), 1002, 'Only analyse tracks in library');
		panel.m.AppendMenuSeparator();
		panel.s10.AppendMenuItem(MF_STRING, 1010, 'Clear all');
		panel.s10.AppendMenuItem(MF_STRING, 1011, 'Clear older than 1 day');
		panel.s10.AppendMenuItem(MF_STRING, 1012, 'Clear older than 7 days');
		panel.s10.AppendMenuItem(MF_STRING, 1013, 'Clear older than 30 days');
		panel.s10.AppendMenuItem(MF_STRING, 1014, 'Clear older than 90 days');
		panel.s10.AppendMenuSeparator();
		panel.s10.AppendMenuItem(MF_GRAYED, 1020, 'In use: ' + utils.FormatFileSize(size));
		panel.s10.AppendTo(panel.m, MF_STRING, 'Cached images');
	}

	this.rbtn_up_done = function (idx) {
		switch (idx) {
		case 1000:
			var tmp = utils.InputBox('All FFmpeg showspectrumpic options should work here.', window.Name, this.properties.params.value);
			if (tmp != this.properties.params.value) {
				this.properties.params.value = tmp;
				this.playback_new_track(fb.GetNowPlaying());
			}
			break;
		case 1001:
			var tmp = utils.ColourPicker(this.properties.marker_colour.value);
			if (tmp != this.properties.marker_colour.value) {
				this.properties.marker_colour.value = tmp;
				window.Repaint();
			}
			break;
		case 1002:
			this.properties.library_only.toggle();
			break;
		case 1010:
		case 1011:
		case 1012:
		case 1013:
		case 1014:
			var period = [0, ONE_DAY, ONE_DAY * 7, ONE_DAY * 30, ONE_DAY * 90][idx - 1010];
			var files = utils.ListFiles(spectrogram_cache).toArray();
			files.forEach(function (item) {
				if (period == 0 || _fileExpired(item, period)) utils.RemovePath(item);
			});
			break;
		}
	}

	this.pos = function () {
		return Math.ceil(this.w * (this.drag ? this.drag_seek : fb.PlaybackTime / fb.PlaybackLength));
	}

	this.repaint_rect = function () {
		window.RepaintRect(this.x - _scale(75), this.y - _scale(10), this.w + _scale(150), this.h + _scale(20));
	}

	this.interval_func = _.bind(function () {
		if (fb.IsPlaying && !fb.IsPaused && fb.PlaybackLength > 0) {
			this.repaint_rect();
		}
	}, this);

	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.spectrogram_mode = spectrogram_mode;
	this.mx = 0;
	this.my = 0;
	this.hover = false;
	this.drag = false;
	this.drag_seek = 0;
	if (this.spectrogram_mode) {
		this.run_cmd_async_done = function (task_id) {
			if (this.task_id == task_id) {
				this.working = false;
				this.image = this.get_image(fb.GetNowPlaying());
				window.Repaint();
			}
		}

		this.clear_image = function () {
			_dispose(this.image);
			this.image = null;
		}

		this.get_image = function (metadb) {
			if (!metadb) return null;
			this.filename = spectrogram_cache + this.tfo.path.EvalWithMetadb(metadb) + utils.ReplaceIllegalChars(this.properties.params.value, true) + '.webp';
			return utils.LoadImage(this.filename)
		}

		this.generate_image = function (metadb) {
			if (!metadb) return;
			this.working = true;
			window.Repaint();
			var extra = this.tfo.tool.Eval().indexOf('exhale') > -1 ? ' -c:a libfdk_aac ' : '';
			var cmd = extra + ' -y -i ' + _q(metadb.Path) + ' -lavfi showspectrumpic=legend=0:' + this.properties.params.value + ' ' + _q(this.filename);
			this.task_id = utils.RunCmdAsync(window.ID, ffmpeg_exe, cmd);
		}

		this.tfo = {
			path : fb.TitleFormat('$crc32($lower($substr(%path%,4,$len(%path%))))'),
			cue : fb.TitleFormat('$if($or($strcmp(%__cue_embedded%,yes),$strcmp($right(%path%,3),cue)),cue,)'),
			tool : fb.TitleFormat('$lower(%__tool%)'),
		};

		this.properties = {
			params : new _p('2K3.SPECTROGRAM.FFMPEG.PARAMS', 's=1024x128'),
			marker_colour : new _p('2K3.SPECTROGRAM.MARKER.COLOUR', RGB(240, 240, 240)),
			library_only : new _p('2K3.SPECTROGRAM.LIBRARY.ONLY', true),
			png_prompted : new _p('2K3.SPECTROGRAM.PNG.PROMPTED', false),
		};

		utils.CreateFolder(spectrogram_cache);
		this.image = null;
		this.filename = '';
		this.working = false;
		this.timeout = false;
		this.task_id = 0;
		window.SetTimeout((function () {
			if (this.properties.png_prompted.enabled) return;
			this.properties.png_prompted.enabled = true;
			var pngs = utils.Glob(spectrogram_cache + '*.png').toArray();
			if (pngs.length > 0 && utils.MessageBox('This script has been updated to save image files as WebP. Your cache folder contains ' + pngs.length + ' PNG files. Would you like to delete them now?', window.Name, MB_YESNO | MB_ICONQUESTION) == IDYES) {
				pngs.forEach(function (item) {
					utils.RemovePath(item);
				});
			}
		}).bind(this), 100);
	}
	window.SetInterval(this.interval_func, 150);
}
