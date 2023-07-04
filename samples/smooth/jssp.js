function on_drag_drop(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (playlist_can_add_items(plman.ActivePlaylist)) {
			plman.ClearPlaylistSelection(plman.ActivePlaylist);
			action.Playlist = plman.ActivePlaylist;
			action.Base = plman.GetPlaylistItemCount(plman.ActivePlaylist);
			action.ToSelect = true;
			action.Effect = 1;
		} else if (plman.PlaylistCount == 0 || plman.ActivePlaylist == -1) {
			action.Playlist = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items");
			action.Base = 0;
			action.ToSelect = true;
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}
}

function on_drag_over(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (plman.PlaylistCount == 0 || plman.ActivePlaylist == -1 || playlist_can_add_items(plman.ActivePlaylist)) {
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}
}

function on_focus(is_focused) {
	if (is_focused) {
		plman.SetActivePlaylistContext();
		g_selHolder.SetPlaylistSelectionTracking();
	} else {
		brw.repaint();
	}
}

function on_item_focus_change(playlist, from, to) {
	g_focus_id = to;

	if (playlist == g_active_playlist) {
		g_focus_row = brw.getOffsetFocusItem(g_focus_id);
		if (g_focus_row < scroll / ppt.rowHeight || g_focus_row > scroll / ppt.rowHeight + brw.totalRowsVis - 0.1) {
			var old = scroll;
			scroll = (g_focus_row - Math.floor(brw.totalRowsVis / 2)) * ppt.rowHeight;
			scroll = check_scroll(scroll);
			if (Math.abs(scroll - scroll_) > ppt.rowHeight * 5) {
				if (scroll_ > scroll) {
					scroll_ = scroll + ppt.rowHeight * 5;
				} else {
					scroll_ = scroll - ppt.rowHeight * 5;
				}
			}
			brw.scrollbar.updateScrollbar();
		}

		if (!isScrolling)
			brw.repaint();
	}
}

function on_key_down(vkey) {
	var mask = GetKeyboardMask();

	if (mask == KMask.none) {
		switch (vkey) {
		case VK_UP:
			if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
				brw.keypressed = true;

				vk_up();
				if (!cScrollBar.timerID) {
					cScrollBar.timerID = window.SetTimeout(function () {
						cScrollBar.timerID = window.SetInterval(vk_up, 100);
					}, 400);
				}
			}
			break;
		case VK_DOWN:
			if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
				brw.keypressed = true;

				vk_down();
				if (!cScrollBar.timerID) {
					cScrollBar.timerID = window.SetTimeout(function () {
						cScrollBar.timerID = window.SetInterval(vk_down, 100);
					}, 400);
				}
			}
			break;
		case VK_PGUP:
			if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
				brw.keypressed = true;

				vk_pgup();
				if (!cScrollBar.timerID) {
					cScrollBar.timerID = window.SetTimeout(function () {
						cScrollBar.timerID = window.SetInterval(vk_pgup, 100);
					}, 400);
				}
			}
			break;
		case VK_PGDN:
			if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
				brw.keypressed = true;

				vk_pgdn();
				if (!cScrollBar.timerID) {
					cScrollBar.timerID = window.SetTimeout(function () {
						cScrollBar.timerID = window.SetInterval(vk_pgdn, 100);
					}, 400);
				}
			}
			break;
		case VK_RETURN:
			play(g_active_playlist, g_focus_id);
			break;
		case VK_END:
			if (brw.rows.length > 0) {
				var new_focus_id = brw.rows[brw.rows.length - 1].playlistTrackId;
				plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
			}
			break;
		case VK_HOME:
			if (brw.rows.length > 0) {
				var new_focus_id = brw.rows[0].playlistTrackId;
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
				plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
			}
			break;
		case VK_DELETE:
			if (playlist_can_remove_items(g_active_playlist)) {
				plman.UndoBackup(g_active_playlist);
				plman.RemovePlaylistSelection(g_active_playlist);
			}
			break;
		}
	} else if (mask == KMask.shift) {
		switch (vkey) {
		case VK_SHIFT:
			brw.SHIFT_count = 0;
			break;
		case VK_UP:
			if (brw.SHIFT_count == 0) {
				if (brw.SHIFT_start_id == null) {
					brw.SHIFT_start_id = g_focus_id;
				}
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
				if (g_focus_id > 0) {
					brw.SHIFT_count--;
					g_focus_id--;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else if (brw.SHIFT_count < 0) {
				if (g_focus_id > 0) {
					brw.SHIFT_count--;
					g_focus_id--;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else {
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
				brw.SHIFT_count--;
				g_focus_id--;
				plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
			}
			break;
		case VK_DOWN:
			if (brw.SHIFT_count == 0) {
				if (brw.SHIFT_start_id == null) {
					brw.SHIFT_start_id = g_focus_id;
				}
				plman.ClearPlaylistSelection(g_active_playlist);
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
				if (g_focus_id < brw.list.Count - 1) {
					brw.SHIFT_count++;
					g_focus_id++;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else if (brw.SHIFT_count > 0) {
				if (g_focus_id < brw.list.Count - 1) {
					brw.SHIFT_count++;
					g_focus_id++;
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
			} else {
				plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
				brw.SHIFT_count++;
				g_focus_id++;
				plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
			}
			break;
		}
	} else if (mask == KMask.ctrl) {
		switch (vkey) {
		case 48: // CTRL+0
			if (ppt.extra_font_size > 0) {
				ppt.extra_font_size = 0;
				window.SetProperty("SMOOTH.EXTRA.FONT.SIZE", ppt.extra_font_size);
				get_font();
				get_metrics();
				get_images();
				brw.repaint();
			}
			break;
		case 65: // CTRL+A
			fb.RunMainMenuCommand("Edit/Select all");
			brw.repaint();
			break;
		case 67: // CTRL+C
			var items = plman.GetPlaylistSelectedItems(g_active_playlist);
			items.CopyToClipboard();
			items.Dispose();
			break;
		case 84: // CTRL+T
			ppt.showHeaderBar = !ppt.showHeaderBar;
			window.SetProperty("SMOOTH.SHOW.TOP.BAR", ppt.showHeaderBar);
			get_metrics();
			brw.repaint();
			break;
		case 86: // CTRL+V
			if (playlist_can_add_items(g_active_playlist) && fb.CheckClipboardContents()) {
				var clipboard_contents = fb.GetClipboardContents();
				plman.UndoBackup(g_active_playlist);
				plman.InsertPlaylistItems(g_active_playlist, plman.GetPlaylistItemCount(g_active_playlist), clipboard_contents);
				clipboard_contents.Dispose();
			}
			break;
		case 88: // CTRL+X
			if (playlist_can_remove_items(g_active_playlist)) {
				var items = plman.GetPlaylistSelectedItems(g_active_playlist);
				if (items.CopyToClipboard()) {
					plman.UndoBackup(g_active_playlist);
					plman.RemovePlaylistSelection(g_active_playlist);
				}
				items.Dispose();
			}
			break;
		case 89: // CTRL+Y
			fb.RunMainMenuCommand("Edit/Redo");
			break;
		case 90: // CTRL+Z
			fb.RunMainMenuCommand("Edit/Undo");
			break;
		}
	}
}

function on_key_up(vkey) {
	brw.keypressed = false;
	kill_scrollbar_timer()
	if (vkey == VK_SHIFT) {
		brw.SHIFT_start_id = null;
		brw.SHIFT_count = 0;
	}
	brw.repaint();
}

function on_metadb_changed(handles, fromhook) {
	if (!foo_playcount && fromhook) return;
	brw.populate();
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	brw.on_mouse("lbtn_dblclk", x, y);
}

function on_mouse_lbtn_down(x, y) {
	brw.on_mouse("lbtn_down", x, y);
}

function on_mouse_lbtn_up(x, y) {
	brw.on_mouse("lbtn_up", x, y);
}

function on_mouse_move(x, y) {
	if (m_x == x && m_y == y)
		return;

	brw.on_mouse("move", x, y);

	m_x = x;
	m_y = y;
}

function on_mouse_rbtn_up(x, y) {
	brw.on_mouse("rbtn_up", x, y);
	return true;
}

function on_mouse_wheel(step) {
	if (utils.IsKeyPressed(VK_CONTROL)) {
		update_extra_font_size(step);
	} else {
		scroll -= step * ppt.rowHeight * ppt.rowScrollStep;
		scroll = check_scroll(scroll);
		brw.on_mouse("wheel", m_x, m_y, step);
	}
}

function on_paint(gr) {
	gr.FillRectangle(0, 0, ww, wh, g_colour_background);
	if (ppt.wallpapermode && g_wallpaperImg) {
		drawImage(gr, g_wallpaperImg, brw.x, brw.y, brw.w, brw.h, true, null, ppt.wallpaperopacity);
	}
	brw.draw(gr);
}

function on_playback_dynamic_info_track(type) {
	if (type == 0) {
		brw.repaint();
	} else if (type == 1) {
		if (ppt.wallpapermode == 1) {
			setWallpaperImg();
		}
		if (ppt.enableDynamicColours) {
			on_colours_changed();
		}
		brw.repaint();
	}
}

function on_playback_new_track() {
	g_time = tfo.time.Eval();
	setWallpaperImg();

	if (ppt.enableDynamicColours) {
		on_colours_changed();
	}

	brw.repaint();
}

function on_playback_pause(state) {
	if (brw.nowplaying_y + ppt.rowHeight > brw.y && brw.nowplaying_y < brw.y + brw.h) {
		brw.repaint();
	}
}

function on_playback_stop(reason) {
	g_time = "";

	if (reason != 2) {
		if (ppt.wallpapermode == 1) {
			setWallpaperImg();
		}
		if (ppt.enableDynamicColours) {
			on_colours_changed();
		}
	}
	brw.repaint();
}

function on_playback_time() {
	g_seconds++;
	g_time = tfo.time.Eval();

	if (brw.nowplaying_y + ppt.rowHeight > brw.y && brw.nowplaying_y < brw.y + brw.h) {
		brw.repaint();
	}
}

function on_playlist_item_ensure_visible(playlist, index) {
	on_item_focus_change(playlist, 0, index);
}

function on_playlist_items_added(playlist_idx) {
	if (playlist_idx == g_active_playlist) {
		g_focus_id = getFocusId();
		brw.populate();
	}
}

function on_playlist_items_removed(playlist_idx, new_count) {
	if (playlist_idx == g_active_playlist) {
		if (new_count == 0) {
			scroll = scroll_ = 0;
		}
		g_focus_id = getFocusId();
		brw.populate();
	}
}

function on_playlist_items_reordered(playlist_idx) {
	if (playlist_idx == g_active_playlist) {
		g_focus_id = getFocusId();
		brw.populate();
	}
}

function on_playlist_items_selection_change() {
	brw.repaint();
}

function on_playlist_switch() {
	g_active_playlist = plman.ActivePlaylist;
	g_focus_id = getFocusId();
	brw.populate();
}

function on_playlists_changed() {
	g_active_playlist = plman.ActivePlaylist;
	brw.update_playlist_info();
	brw.repaint();
}

function oBrowser() {
	this.repaint = function () {
		need_repaint = true;
	}

	this.setSize = function () {
		this.x = 0;
		this.y = ppt.showHeaderBar ? ppt.headerBarHeight : 0;
		this.w = ww - cScrollBar.width;
		this.h = wh - this.y;
		this.totalRows = Math.ceil(this.h / ppt.rowHeight);
		this.totalRowsVis = Math.floor(this.h / ppt.rowHeight);

		this.scrollbar.setSize();

		scroll = Math.round(scroll / ppt.rowHeight) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		scroll_ = scroll;

		this.scrollbar.updateScrollbar();
	}

	this.setList = function () {
		this.rows = [];
		var r = 0;

		for (var i = 0; i < this.groups.length; i++) {
			var s = this.groups[i].start;

			if (ppt.showGroupHeaders) {
				this.groups[i].rowId = r;
				for (var k = 0; k < ppt.groupHeaderRowsNumber; k++) {
					this.rows[r] = new Object();
					this.rows[r].type = k + 1;
					this.rows[r].metadb = this.groups[i].metadb;
					this.rows[r].albumId = i;
					this.rows[r].albumTrackId = 0;
					this.rows[r].playlistTrackId = s;
					this.rows[r].groupkey = this.groups[i].groupkey;
					r++;
				}
			}

			var m = this.groups[i].count;
			for (var j = 0; j < m; j++) {
				this.rows[r] = new Object();
				this.rows[r].type = 0;
				this.rows[r].metadb = this.list.GetItem(s + j);
				this.rows[r].track_tf = this.track_tf_arr[s + j];
				this.rows[r].albumId = i;
				this.rows[r].albumTrackId = j;
				this.rows[r].playlistTrackId = s + j;
				this.rows[r].groupkey = this.groups[i].groupkey;
				r++;
			}
		}
	}

	this.showFocusedItem = function () {
		g_focus_row = this.getOffsetFocusItem(g_focus_id);
		scroll = (g_focus_row - Math.floor(this.totalRowsVis / 2)) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		this.scrollbar.updateScrollbar();
	}

	this.selectAtoB = function (start_id, end_id) {
		if (start_id == -1 || end_id == -1) return;
		var affectedItems = Array();

		if (this.SHIFT_start_id == null) {
			this.SHIFT_start_id = start_id;
		}

		plman.ClearPlaylistSelection(g_active_playlist);

		var previous_focus_id = g_focus_id;

		if (start_id < end_id) {
			var deb = start_id;
			var fin = end_id;
		} else {
			var deb = end_id;
			var fin = start_id;
		}

		for (var i = deb; i <= fin; i++) {
			affectedItems.push(i);
		}
		plman.SetPlaylistSelection(g_active_playlist, affectedItems, true);
		plman.SetPlaylistFocusItem(g_active_playlist, end_id);

		if (affectedItems.length > 1) {
			if (end_id > previous_focus_id) {
				var delta = end_id - previous_focus_id;
				this.SHIFT_count += delta;
			} else {
				var delta = previous_focus_id - end_id;
				this.SHIFT_count -= delta;
			}
		}
	}

	this.getAlbumIdfromTrackId = function (value) {
		if (value >= 0) {
			var mediane = 0;
			var deb = 0;
			var fin = this.groups.length - 1;
			while (deb <= fin) {
				mediane = Math.floor((fin + deb) / 2);
				if (value >= this.groups[mediane].start && value < this.groups[mediane].start + this.groups[mediane].count) {
					return mediane;
				} else if (value < this.groups[mediane].start) {
					fin = mediane - 1;
				} else {
					deb = mediane + 1;
				}
			}
		}
		return -1;
	}

	this.getOffsetFocusItem = function (fid) {
		var row_idx = 0;
		if (fid > -1) {
			if (ppt.showGroupHeaders) {
				g_focus_album_id = this.getAlbumIdfromTrackId(fid);
				for (i = 0; i < this.rows.length; i++) {
					if (this.rows[i].type != 0 && this.rows[i].albumId == g_focus_album_id) {
						var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
						row_idx = i + ppt.groupHeaderRowsNumber + albumTrackId;
						break;
					}
				}
			} else {
				g_focus_album_id = this.getAlbumIdfromTrackId(fid);
				for (i = 0; i < this.rows.length; i++) {
					if (this.rows[i].type == 0 && this.rows[i].albumId == g_focus_album_id) {
						var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
						row_idx = i + albumTrackId;
						break;
					}
				}
			}
		}
		return row_idx;
	}

	this.get_track_tags = function (index) {
		var track_arr = this.rows[index].track_tf.split(" ^^ ");
		var tags = {
			artist : track_arr[0],
			title : track_arr[1],
			tracknumber : track_arr[2],
			length : track_arr[3],
			rating : track_arr[4],
		};
		return tags;
	}

	this.init_groups = function () {
		this.groups = [];
		if (this.list.Count == 0) return;

		var arr = tfo.groupkey.EvalWithMetadbs(this.list).toArray();
		var previous = "";
		var g = 0, t = 0;

		for (var i = 0; i < this.list.Count; i++) {
			var handle = this.list.GetItem(i);
			var pos = arr[i].lastIndexOf(" ^^ ");
			var cachekey = arr[i].substr(pos + 4);
			var meta = arr[i].substr(0, pos);
			var current = meta.toLowerCase();

			if (current != previous) {
				if (g > 0) {
					this.groups[g - 1].finalise(t);
					t = 0;
				}
				this.groups.push(new oGroup(g, i, handle, meta, cachekey));
				t++;
				g++;
				previous = current;
			} else {
				t++;
			}
		}

		this.groups[g - 1].finalise(t);
	}

	this.populate = function () {
		this.list = plman.GetPlaylistItems(g_active_playlist);
		this.track_tf_arr = tfo.track.EvalWithMetadbs(this.list).toArray();

		this.init_groups();
		this.setList();
		g_focus_row = this.getOffsetFocusItem(g_focus_id);

		this.update_playlist_info();
		this.scrollbar.updateScrollbar();
		this.repaint();
	}

	this.update_playlist_info = function () {
		this.playlist_info = "";
		if (g_active_playlist > -1) {
			this.playlist_info = plman.GetPlaylistName(g_active_playlist);
			var duration = this.list.CalcTotalDuration();
			this.playlist_info += ", " + this.list.count + (this.list.count == 1 ? " track" : " tracks") + (duration > 0 ? ", " + utils.FormatDuration(duration) : "");
		}
	}

	this.getlimits = function () {
		if (this.rows.length <= this.totalRowsVis) {
			var start_ = 0;
			var end_ = this.rows.length - 1;
		} else {
			if (scroll_ < 0)
				scroll_ = scroll;
			var start_ = Math.round(scroll_ / ppt.rowHeight + 0.4);
			var end_ = start_ + this.totalRows + (ppt.groupHeaderRowsNumber - 1);
			start_ = start_ > 0 ? start_ - 1 : start_;
			if (start_ < 0)
				start_ = 0;
			if (end_ >= this.rows.length)
				end_ = this.rows.length - 1;
		}
		g_start_ = start_;
		g_end_ = end_;
	}

	this.draw = function (gr) {
		this.getlimits();

		if (this.rows.length > 0) {
			var ax = 0;
			var ay = 0;
			var aw = this.w;
			var ah = ppt.rowHeight;
			var g = 0;

			if (fb.IsPlaying && plman.PlayingPlaylist == g_active_playlist) {
				this.nowplaying = plman.GetPlayingItemLocation();
			} else {
				this.nowplaying = null;
			}

			for (var i = g_start_; i <= g_end_; i++) {
				ay = Math.floor(this.y + (i * ah) - scroll_);
				var normal_text = g_colour_text;
				var fader_txt = setAlpha(normal_text, 180);

				switch (this.rows[i].type) {
				case ppt.groupHeaderRowsNumber:
					ay -= (ppt.groupHeaderRowsNumber - 1) * ah;

					gr.FillRectangle(ax, ay, aw, ah * ppt.groupHeaderRowsNumber, setAlpha(g_colour_text, 8));
					gr.DrawRectangle(ax, ay, aw, ah * ppt.groupHeaderRowsNumber, 1, setAlpha(g_colour_text, 25));

					var id = this.rows[i].albumId;
					var image_height = 0;
					if (ppt.groupHeaderRowsNumber >= 2) {
						image_height = ah * ppt.groupHeaderRowsNumber;
						if (!this.groups[id].cover_image && !this.groups[id].image_requested) {
							this.groups[id].image_requested = true;
							var filename = generate_filename(this.groups[id].cachekey, AlbumArtId.front);
							this.groups[id].cover_image = get_art(this.rows[i].metadb, filename, AlbumArtId.front);
						}
						drawImage(gr, this.groups[id].cover_image || (this.rows[i].metadb.Length ? images.noart : images.stream), ax + 1, ay + 1, image_height - 3, image_height - 3, ppt.autoFill, g_colour_text & 0x25ffffff);
					}

					var group_text_colour = g_colour_highlight;
					var group_text_colour_fader = setAlpha(group_text_colour, 180);

					var text_width = aw - image_height - 30;
					if (ppt.groupHeaderRowsNumber == 1) {
						gr.WriteText(this.groups[id].bottom_left + " - " + this.groups[id].top_left, g_font_group1, group_text_colour, ax + image_height + 5, ay, text_width - this.groups[id].top_right.calc_width(g_font_group1), ah, 0, 2, 1, 1);
						gr.WriteText(this.groups[id].top_right, g_font_group1, group_text_colour, 0, ay, aw - 5, ah, 1, 2, 1, 1);
					} else {
						gr.WriteText(this.groups[id].top_left, g_font_group1, group_text_colour, ax + image_height + 5, ay, text_width - this.groups[id].top_right.calc_width(g_font_group1), ah, 0, 2, 1, 1);
						gr.WriteText(this.groups[id].top_right, g_font_group1, group_text_colour, 0, ay, aw - 5, ah, 1, 2, 1, 1);

						var bottom_y = ay + 5 + g_font_group2_height;
						gr.WriteText(this.groups[id].bottom_left, g_font_group2, group_text_colour_fader, ax + image_height + 5, bottom_y, text_width - this.groups[id].bottom_right.calc_width(g_font_group2), ah, 0, 2, 1, 1);
						gr.WriteText(this.groups[id].bottom_right, g_font_group2, group_text_colour_fader, 0, bottom_y, aw - 5, ah, 1, 2, 1, 1);
					}
					break;
				case 0:
					if (ppt.showGroupHeaders ? this.rows[i].albumTrackId % 2 != 0 : i % 2 != 0) {
						gr.FillRectangle(ax, ay, aw, ah, setAlpha(g_colour_text, 8));
					}

					if (plman.IsPlaylistItemSelected(g_active_playlist, this.rows[i].playlistTrackId)) {
						drawSelectedRectangle(gr, ax, ay, aw, ah);
						normal_text = g_colour_selected_text;
						fader_txt = setAlpha(normal_text, 180);
					}

					if (!this.rows[i].tags) {
						this.rows[i].tags = this.get_track_tags(i);
					}

					var tags = this.rows[i].tags;

					var rw = 0;
					if (ppt.showRating) {
						rw = g_rating_width;
						this.rating_x = aw - rw - g_time_width;
						gr.WriteText(chars.rating_off.repeat(5), g_font_rating, setAlpha(normal_text, 98), this.rating_x, ay, rw, ah, 0, 2);
						gr.WriteText(chars.rating_on.repeat(tags.rating), g_font_rating, normal_text, this.rating_x, ay, rw, ah, 0, 2);
					}

					var artist = tags.artist;
					var title = tags.title;
					var isplaying = this.nowplaying && this.rows[i].playlistTrackId == this.nowplaying.PlaylistItemIndex;
					if (isplaying) {
						var arr = tfo.artist_title.Eval().split(" ^^ ");
						artist = arr[0];
						title = arr[1];

						this.nowplaying_y = ay;
						if (fb.IsPaused) {
							gr.WriteText(chars.pause, g_font_awesome, normal_text, ax, ay, ah, ah, 2, 2);
						} else {
							gr.WriteText(chars.play, g_font_awesome, g_seconds % 2 == 0 ? normal_text : setAlpha(normal_text, 128), ax, ay, ah, ah, 2, 2);
						}
					}

					if (ppt.doubleRowText) {
						if (isplaying) {
							gr.WriteText(g_time, g_font, normal_text, ax, ay, aw - 5, ah / 2, 1, 2, 1, 1);
						} else {
							gr.WriteText(tags.tracknumber, g_font, normal_text, ax, ay, ah, ah / 2, 2, 2, 1, 1);
							gr.WriteText(tags.length, g_font, normal_text, ax, ay, aw - 5, ah / 2, 1, 2, 1, 1);
						}

						gr.WriteText(title, g_font, normal_text, ax + ah, ay, aw - ah - rw - g_time_width - 10, ah / 2, 0, 2, 1, 1);
						gr.WriteText(artist, g_font, fader_txt, ax + ah, ay + (ah / 2) - 2, aw - ah - rw - g_time_width - 10, ah / 2, 0, 2, 1, 1);
					} else {
						if (isplaying) {
							gr.WriteText(g_time, g_font, normal_text, ax, ay, aw - 5, ah, 1, 2, 1, 1);
						} else {
							gr.WriteText(tags.tracknumber, g_font, fader_txt, ax, ay, ah, ah, 2, 2, 1, 1);
							gr.WriteText(tags.length, g_font, normal_text, ax, ay, aw - 5, ah, 1, 2, 1, 1);
						}

						gr.WriteText(ppt.showArtistAlways ? artist + " - " + title : title, g_font, normal_text, ax + ah, ay, aw - ah - rw - g_time_width - 10, ah, 0, 2, 1, 1);
					}
					break;
				}
			}
		}

		this.scrollbar.draw(gr);

		if (ppt.showHeaderBar) {
			gr.FillRectangle(0, 0, ww, this.y - 1, g_colour_background);
			gr.FillRectangle(this.x, 0, this.w + cScrollBar.width, ppt.headerBarHeight - 1, g_colour_background & 0x20ffffff);
			gr.FillRectangle(this.x, ppt.headerBarHeight - 2, this.w + cScrollBar.width, 1, g_colour_text & 0x22ffffff);
			gr.WriteText(this.playlist_info, g_font_box, g_colour_text, 0, 0, ww - 5, ppt.headerBarHeight - 1, 1, 2, 1, 1);
		}
	}

	this.selectGroupTracks = function (aId) {
		var affectedItems = [];
		var end = this.groups[aId].start + this.groups[aId].count;
		for (var i = this.groups[aId].start; i < end; i++) {
			affectedItems.push(i);
		}
		plman.SetPlaylistSelection(g_active_playlist, affectedItems, true);
	}

	this._isHover = function (x, y) {
		return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
	}

	this.on_mouse = function (event, x, y) {
		if (g_active_playlist == -1) return;
		this.ishover = this._isHover(x, y);

		if (this.ishover) {
			this.activeRow = Math.ceil((y + scroll_ - this.y) / ppt.rowHeight - 1);
			if (this.activeRow >= this.rows.length) {
				this.activeRow = -1;
			}
		} else {
			this.activeRow = -1;
		}

		var rating_hover = ppt.showRating && this.activeRow > -1 && x > this.rating_x && x < this.rating_x + g_rating_width;

		switch (event) {
		case "lbtn_down":
			if (y > this.y && !rating_hover && Math.abs(scroll - scroll_) < 2) {
				if (this.activeRow == -1) {
					plman.ClearPlaylistSelection(g_active_playlist);
				} else {
					var playlistTrackId = this.rows[this.activeRow].playlistTrackId;
					var rowType = this.rows[this.activeRow].type;

					switch (true) {
					case rowType > 0: // ----------------> group header row
						if (utils.IsKeyPressed(VK_SHIFT)) {
							if (g_focus_id != playlistTrackId) {
								if (this.SHIFT_start_id != null) {
									this.selectAtoB(this.SHIFT_start_id, playlistTrackId);
								} else {
									this.selectAtoB(g_focus_id, playlistTrackId);
								}
							}
						} else if (utils.IsKeyPressed(VK_CONTROL)) {
							this.selectGroupTracks(this.rows[this.activeRow].albumId);
							this.SHIFT_start_id = null;
						} else {
							plman.ClearPlaylistSelection(g_active_playlist);
							this.selectGroupTracks(this.rows[this.activeRow].albumId);
							this.SHIFT_start_id = null;
						}
						plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						break;
					case rowType == 0: // ----------------> track row
						if (utils.IsKeyPressed(VK_SHIFT)) {
							if (g_focus_id != playlistTrackId) {
								if (this.SHIFT_start_id != null) {
									this.selectAtoB(this.SHIFT_start_id, playlistTrackId);
								} else {
									this.selectAtoB(g_focus_id, playlistTrackId);
								}
							}
						} else if (utils.IsKeyPressed(VK_CONTROL)) {
							if (plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
								plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, false);
							} else {
								plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
							}
							this.SHIFT_start_id = null;
						} else {
							if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
							}
							this.SHIFT_start_id = null;
						}
						break;
					}
					this.repaint();
				}
			}
			break;
		case "lbtn_up":
			if (rating_hover && this.rows[this.activeRow].metadb) {
				var handles = fb.CreateHandleList(this.rows[this.activeRow].metadb);
				var new_rating = Math.ceil((x - this.rating_x) / (g_rating_width / 5));

				if (foo_playcount) {
					if (new_rating != this.rows[this.activeRow].tags.rating && new_rating > 0) {
						handles.RunContextCommand("Playback Statistics/Rating/" + new_rating);
					} else {
						handles.RunContextCommand("Playback Statistics/Rating/<not set>");
					}
				} else {
					var rp = this.rows[this.activeRow].metadb.RawPath;
					if (rp.indexOf("file://") == 0 || rp.indexOf("cdda://") == 0) {
						if (new_rating != this.rows[this.activeRow].tags.rating && new_rating > 0) {
							handles.UpdateFileInfoFromJSON(JSON.stringify({"RATING" : new_rating}));
						} else {
							handles.UpdateFileInfoFromJSON(JSON.stringify({"RATING" : ""}));
						}
					}
				}

				handles.Dispose();
			} else {
				if (this.activeRow > -1) {
					if (this.rows[this.activeRow].type == 0) { // ----------------> track row
						var playlistTrackId = this.rows[this.activeRow].playlistTrackId;
						if (!utils.IsKeyPressed(VK_SHIFT) && !utils.IsKeyPressed(VK_CONTROL)) {
							if (plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
								if (plman.GetPlaylistSelectedItems(g_active_playlist).Count > 1) {
									plman.ClearPlaylistSelection(g_active_playlist);
									plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
									plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
								}
							}
						}
					}
					this.repaint();
				}
			}
			break;
		case "lbtn_dblclk":
			if (y < this.y && ppt.wallpapermode == 1 && fb.IsPlaying) {
				fb.GetNowPlaying().ShowAlbumArtViewer();
			} else if (y > this.y && !rating_hover && this.ishover && this.activeRow > -1 && Math.abs(scroll - scroll_) < 2) {
				if (this.rows[this.activeRow].type == 0) {
					play(g_active_playlist, this.rows[this.activeRow].playlistTrackId);
				}
				this.repaint();
			}
			break;
		case "rbtn_up":
			if (this.ishover && this.activeRow > -1 && Math.abs(scroll - scroll_) < 2) {
				var rowType = this.rows[this.activeRow].type;
				switch (true) {
				case rowType > 0: // ----------------> group header row
					var playlistTrackId = this.rows[this.activeRow].playlistTrackId;
					if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
						plman.ClearPlaylistSelection(g_active_playlist);
						this.selectGroupTracks(this.rows[this.activeRow].albumId);
						plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						this.SHIFT_start_id = null;
					}
					this.context_menu(x, y, this.track_index, this.row_index);
					break;
				case rowType == 0: // ----------------> track row
					var playlistTrackId = this.rows[this.activeRow].playlistTrackId;
					if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
						plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
					}
					this.context_menu(x, y, playlistTrackId, this.activeRow);
					break;
				}
				this.repaint();
			} else {
				this.settings_context_menu(x, y);
			}
			break;
		}
		if (cScrollBar.visible) {
			this.scrollbar.on_mouse(event, x, y);
		}
	}

	this.g_time = window.SetInterval(function () {
		if (!window.IsVisible) {
			need_repaint = true;
			return;
		}

		if (m_y > brw.y && m_y < brw.y + brw.h) {
			brw.activeRow = Math.ceil((m_y + scroll_ - brw.y) / ppt.rowHeight - 1);
			if (brw.activeRow >= brw.rows.length)
				brw.activeRow = -1;
		} else {
			brw.activeRow = -1;
		}

		scroll = check_scroll(scroll);
		if (Math.abs(scroll - scroll_) >= 1) {
			scroll_ += (scroll - scroll_) / ppt.scrollSmoothness;
			need_repaint = true;
			isScrolling = true;
			if (scroll_prev != scroll)
				brw.scrollbar.updateScrollbar();
		} else {
			if (isScrolling) {
				if (scroll_ < 1)
					scroll_ = 0;
				isScrolling = false;
				need_repaint = true;
			}
		}
		if (need_repaint) {
			need_repaint = false;
			window.Repaint();
		}

		scroll_prev = scroll;

	}, ppt.refreshRate);

	this.context_menu = function (x, y, id, row_id) {
		var menu = window.CreatePopupMenu();
		var add = window.CreatePopupMenu();
		var context = fb.CreateContextMenuManager();

		var remove_flag = EnableMenuIf(playlist_can_remove_items(g_active_playlist));

		menu.AppendMenuItem(remove_flag, 1, "Crop");
		menu.AppendMenuItem(remove_flag, 2, "Remove");
		menu.AppendMenuItem(MF_STRING, 3, "Invert Selection");
		menu.AppendMenuSeparator();
		menu.AppendMenuItem(remove_flag, 4, "Cut");
		menu.AppendMenuItem(MF_STRING, 5, "Copy");
		menu.AppendMenuItem(EnableMenuIf(playlist_can_add_items(g_active_playlist) && fb.CheckClipboardContents()), 6, "Paste");
		menu.AppendMenuSeparator();

		add.AppendMenuItem(MF_STRING, 10, "New Playlist");
		if (plman.PlaylistCount > 0) {
			add.AppendMenuSeparator();
		}
		for (var i = 0; i < plman.PlaylistCount; i++) {
			add.AppendMenuItem(EnableMenuIf(i != g_active_playlist && playlist_can_add_items(i)), 100 + i, plman.GetPlaylistName(i));
		}
		add.AppendTo(menu, MF_STRING, "Add to");
		menu.AppendMenuSeparator();

		var selected_items = plman.GetPlaylistSelectedItems(g_active_playlist);
		context.InitContextPlaylist();
		context.BuildMenu(menu, 1000);

		var idx = menu.TrackPopupMenu(x, y);
		menu.Dispose();

		switch (true) {
		case idx == 0:
			break;
		case idx == 1:
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist, true);
			break;
		case idx == 2:
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist);
			break;
		case idx == 3:
			plman.InvertSelection(g_active_playlist);
			break;
		case idx == 4:
			selected_items.CopyToClipboard();
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist);
			break;
		case idx == 5:
			selected_items.CopyToClipboard();
			break;
		case idx == 6:
			var base = getFocusId();
			if (base == -1) {
				base = plman.GetPlaylistItemCount(g_active_playlist);
			} else {
				base++;
			}
			var clipboard_contents = fb.GetClipboardContents();
			plman.UndoBackup(g_active_playlist);
			plman.InsertPlaylistItems(g_active_playlist, base, clipboard_contents);
			clipboard_contents.Dispose();
			break;
		case idx == 10:
			var pl = plman.CreatePlaylist();
			plman.ActivePlaylist = pl;
			plman.InsertPlaylistItems(pl, 0, selected_items);
			break;
		case idx < 1000:
			var pl = idx - 100;
			plman.UndoBackup(pl);
			plman.InsertPlaylistItems(pl, plman.GetPlaylistItemCount(pl), selected_items);
			break;
		case idx >= 1000:
			context.ExecuteByID(idx - 1000);
			break;
		}
		selected_items.Dispose();
		context.Dispose();
		return true;
	}

	this.settings_context_menu = function (x, y) {
		var menu = window.CreatePopupMenu();
		var sub1 = window.CreatePopupMenu();
		var sub2 = window.CreatePopupMenu();
		var sub3 = window.CreatePopupMenu();
		var sub4 = window.CreatePopupMenu();

		menu.AppendMenuItem(CheckMenuIf(ppt.showHeaderBar), 1, "Header Bar");
		menu.AppendMenuSeparator();

		var colour_flag = EnableMenuIf(ppt.enableCustomColours);
		sub1.AppendMenuItem(CheckMenuIf(ppt.enableDynamicColours), 2, "Enable Dynamic");
		sub1.AppendMenuItem(CheckMenuIf(ppt.enableCustomColours), 3, "Enable Custom");
		sub1.AppendMenuSeparator();
		sub1.AppendMenuItem(colour_flag, 4, "Text");
		sub1.AppendMenuItem(colour_flag, 5, "Background");
		sub1.AppendMenuItem(colour_flag, 6, "Selected background");
		sub1.AppendTo(menu, MF_STRING, "Colours");
		menu.AppendMenuSeparator();

		sub2.AppendMenuItem(MF_STRING, 10, "None");
		sub2.AppendMenuItem(MF_STRING, 11, "Front cover of playing track");
		sub2.AppendMenuItem(MF_STRING, 12, "Custom image");
		sub2.CheckMenuRadioItem(10, 12, ppt.wallpapermode + 10);
		sub2.AppendMenuSeparator();
		sub2.AppendMenuItem(EnableMenuIf(ppt.wallpapermode == 2), 13, "Custom image path...");
		sub2.AppendMenuSeparator();
		sub2.AppendMenuItem(GetMenuFlags(ppt.wallpapermode != 0, ppt.wallpaperblurred), 14, "Blur");
		sub2.AppendTo(menu, MF_STRING, "Background Wallpaper");

		sub3.AppendMenuItem(CheckMenuIf(ppt.showGroupHeaders), 20, "Enable");
		sub3.AppendMenuSeparator();
		sub3.AppendMenuItem(MF_GRAYED, 0, "Rows");
		sub3.AppendMenuItem(EnableMenuIf(ppt.showGroupHeaders), 21, "1");
		sub3.AppendMenuItem(EnableMenuIf(ppt.showGroupHeaders), 22, "2");
		sub3.AppendMenuItem(EnableMenuIf(ppt.showGroupHeaders), 23, "3");
		sub3.CheckMenuRadioItem(21, 23, ppt.groupHeaderRowsNumber + 20);
		sub3.AppendMenuSeparator();
		sub3.AppendMenuItem(GetMenuFlags(ppt.showGroupHeaders && ppt.groupHeaderRowsNumber > 1, ppt.autoFill), 24, "Album Art: Auto-fill");
		sub3.AppendTo(menu, MF_STRING, "Group Headers");

		sub4.AppendMenuItem(CheckMenuIf(ppt.doubleRowText), 30, "Double Track Line");
		sub4.AppendMenuSeparator()
		sub4.AppendMenuItem(GetMenuFlags(!ppt.doubleRowText, ppt.showArtistAlways), 31, "Artist");
		sub4.AppendMenuItem(CheckMenuIf(ppt.showRating), 32, "Rating");
		sub4.AppendTo(menu, MF_STRING, "Track Info");
		menu.AppendMenuSeparator();

		menu.AppendMenuItem(MF_STRING, 50, "Configure...");

		var idx = menu.TrackPopupMenu(x, y);
		menu.Dispose();

		switch (idx) {
		case 1:
			ppt.showHeaderBar = !ppt.showHeaderBar;
			window.SetProperty("SMOOTH.SHOW.TOP.BAR", ppt.showHeaderBar);
			get_metrics();
			this.repaint();
			break;
		case 2:
			ppt.enableDynamicColours = !ppt.enableDynamicColours;
			window.SetProperty("SMOOTH.DYNAMIC.COLOURS.ENABLED", ppt.enableDynamicColours);
			on_colours_changed();
			break
		case 3:
			ppt.enableCustomColours = !ppt.enableCustomColours;
			window.SetProperty("SMOOTH.CUSTOM.COLOURS.ENABLED", ppt.enableCustomColours);
			on_colours_changed();
			break;
		case 4:
			g_colour_text = utils.ColourPicker(g_colour_text);
			window.SetProperty("SMOOTH.COLOUR.TEXT", g_colour_text);
			on_colours_changed();
			break;
		case 5:
			g_colour_background = utils.ColourPicker(g_colour_background);
			window.SetProperty("SMOOTH.COLOUR.BACKGROUND.NORMAL", g_colour_background);
			on_colours_changed();
			break;
		case 6:
			g_colour_selection = utils.ColourPicker(g_colour_selection);
			window.SetProperty("SMOOTH.COLOUR.BACKGROUND.SELECTED", g_colour_selection);
			on_colours_changed();
			break;
		case 10:
		case 11:
		case 12:
			ppt.wallpapermode = idx - 10;
			window.SetProperty("SMOOTH.WALLPAPER.MODE2", ppt.wallpapermode);
			setWallpaperImg();
			this.repaint();
			break;
		case 13:
			var tmp = utils.InputBox("Enter the full path to an image.", window.Name, ppt.wallpaperpath);
			if (tmp != ppt.wallpaperpath) {
				ppt.wallpaperpath = tmp;
				window.SetProperty("SMOOTH.WALLPAPER.PATH", ppt.wallpaperpath);
				setWallpaperImg();
				this.repaint();
			}
			break;
		case 14:
			ppt.wallpaperblurred = !ppt.wallpaperblurred;
			window.SetProperty("SMOOTH.WALLPAPER.BLURRED", ppt.wallpaperblurred);
			setWallpaperImg();
			this.repaint();
			break;
		case 20:
			ppt.showGroupHeaders = !ppt.showGroupHeaders;
			window.SetProperty("SMOOTH.SHOW.GROUP.HEADERS", ppt.showGroupHeaders);
			get_metrics();
			this.repaint();
			break;
		case 21:
		case 22:
		case 23:
			ppt.groupHeaderRowsNumber = idx - 20;
			window.SetProperty("SMOOTH.HEADER.ROWS", ppt.groupHeaderRowsNumber);
			this.populate();
			break;
		case 24:
			ppt.autoFill = !ppt.autoFill;
			window.SetProperty("SMOOTH.AUTO.FILL", ppt.autoFill);
			images.clear();
			this.populate();
			break;
		case 30:
			ppt.doubleRowText = !ppt.doubleRowText;
			window.SetProperty("SMOOTH.DOUBLE.ROW.TEXT", ppt.doubleRowText);
			get_metrics();
			this.repaint();
			break;
		case 31:
			ppt.showArtistAlways = !ppt.showArtistAlways;
			window.SetProperty("SMOOTH.SHOW.ARTIST.ALWAYS", ppt.showArtistAlways);
			get_metrics();
			this.repaint();
			break;
		case 32:
			ppt.showRating = !ppt.showRating;
			window.SetProperty("SMOOTH.SHOW.RATING", ppt.showRating);
			get_metrics();
			this.repaint();
			break;
		case 50:
			window.ShowConfigure();
			break;
		}

		return true;
	}

	window.SetTimeout(function () {
		brw.populate();
		brw.showFocusedItem();
	}, 100);

	this.groups = [];
	this.rows = [];
	this.SHIFT_start_id = null;
	this.SHIFT_count = 0;
	this.scrollbar = new oScrollbar();
	this.keypressed = false;
	this.playlist_info = "";
	this.list = fb.CreateHandleList();
	this.track_tf_arr = [];
}

function oGroup(index, start, handle, groupkey, cachekey) {
	this.index = index;
	this.start = start;
	this.count = 1;
	this.metadb = handle;
	this.groupkey = groupkey;
	this.cachekey = cachekey;
	this.cover_image = null;
	this.image_requested = false;

	var arr = this.groupkey.split(" ^^ ");
	this.top_left = arr[0] || "";
	this.bottom_left = arr[1] || "";
	this.top_right = arr[2] || "";
	this.bottom_right = arr[3] || "";

	this.finalise = function (count) {
		this.count = count;
	}
}

function get_metrics() {
	if (ppt.showHeaderBar) {
		ppt.headerBarHeight = scale(ppt.defaultHeaderBarHeight);
	} else {
		ppt.headerBarHeight = 0;
	}

	if (ppt.doubleRowText) {
		ppt.rowHeight = scale(ppt.defaultRowHeight + ppt.doubleRowPixelAdds);
	} else {
		ppt.rowHeight = scale(ppt.defaultRowHeight);
	}

	cScrollBar.width = scale(cScrollBar.defaultWidth);
	cScrollBar.minCursorHeight = scale(cScrollBar.defaultMinCursorHeight);

	brw.setSize();
	brw.setList();
}

function kill_scrollbar_timer() {
	cScrollBar.timerCounter = -1;
	if (cScrollBar.timerID) {
		window.ClearTimeout(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}
}

function vk_up() {
	var scrollstep = 1;
	var new_focus_id = 0;
	var new_row = 0;

	new_row = g_focus_row - scrollstep;
	if (new_row < 0) {
		if (ppt.showGroupHeaders) {
			new_row = ppt.groupHeaderRowsNumber;
		} else {
			new_row = 0;
		}
		kill_scrollbar_timer();
	} else {
		if (brw.rows[new_row].type != 0) {
			new_row -= ppt.groupHeaderRowsNumber;
		}
	}
	if (new_row >= 0) {
		new_focus_id = brw.rows[new_row].playlistTrackId;
		plman.ClearPlaylistSelection(g_active_playlist);
		plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
		plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
	} else {
		kill_scrollbar_timer();
	}
}

function vk_down() {
	var scrollstep = 1;
	var new_focus_id = 0;
	var new_row = 0;

	new_row = g_focus_row + scrollstep;
	if (new_row > brw.rows.length - 1) {
		new_row = brw.rows.length - 1;
		kill_scrollbar_timer();
	} else {
		if (brw.rows[new_row].type != 0) {
			if (brw.rows[new_row].type <= 1) {
				new_row += ppt.groupHeaderRowsNumber;
			}
		}
	}
	if (new_row < brw.rows.length) {
		new_focus_id = brw.rows[new_row].playlistTrackId;
		plman.ClearPlaylistSelection(g_active_playlist);
		plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
		plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
	} else {
		kill_scrollbar_timer();
	}
}

function vk_pgup() {
	var scrollstep = brw.totalRowsVis;
	var new_focus_id = 0;
	var new_row = 0;

	new_row = g_focus_row - scrollstep;
	if (new_row < 0) {
		new_row = ppt.groupHeaderRowsNumber;
		kill_scrollbar_timer();
	} else {
		if (brw.rows[new_row].type != 0) {
			new_row += (ppt.groupHeaderRowsNumber - brw.rows[new_row].type + 1);
		}
	}
	if (new_row >= 0) {
		new_focus_id = brw.rows[new_row].playlistTrackId;
		plman.ClearPlaylistSelection(g_active_playlist);
		plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
		plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
	} else {
		kill_scrollbar_timer();
	}
}

function vk_pgdn() {
	var scrollstep = brw.totalRowsVis;
	var new_focus_id = 0,
	new_row = 0;

	new_row = g_focus_row + scrollstep;
	if (new_row > brw.rows.length - 1) {
		new_row = brw.rows.length - 1;
	} else {
		if (brw.rows[new_row].type != 0) {
			new_row += (ppt.groupHeaderRowsNumber - brw.rows[new_row].type + 1);
		}
	}
	if (new_row < brw.rows.length) {
		new_focus_id = brw.rows[new_row].playlistTrackId;
		plman.ClearPlaylistSelection(g_active_playlist);
		plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
		plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
	} else {
		kill_scrollbar_timer();
	}
}

function check_scroll(scroll___) {
	if (scroll___ < 0)
		scroll___ = 0;
	var g1 = brw.h - (brw.totalRowsVis * ppt.rowHeight);
	var end_limit = (brw.rows.length * ppt.rowHeight) - (brw.totalRowsVis * ppt.rowHeight) - g1;
	if (scroll___ != 0 && scroll___ > end_limit) {
		scroll___ = end_limit;
	}
	return isNaN(scroll___) ? 0 : scroll___;
}

function getFocusId() {
	return plman.GetPlaylistFocusItemIndex(g_active_playlist);
}

ppt.groupkey_tf = window.GetProperty("SMOOTH.GROUPKEY", "$if2(%album%,$if(%length%,'('Singles')',%title%)) ^^ $if2(%album artist%,$if(%length%,%directory%,Stream)) ^^ [%date%] ^^ [%genre%]")
ppt.doubleRowPixelAdds = 3;
ppt.doubleRowText = window.GetProperty("SMOOTH.DOUBLE.ROW.TEXT", true);
ppt.groupHeaderRowsNumber = window.GetProperty("SMOOTH.HEADER.ROWS", 2);
ppt.showArtistAlways = window.GetProperty("SMOOTH.SHOW.ARTIST.ALWAYS", true);
ppt.showGroupHeaders = window.GetProperty("SMOOTH.SHOW.GROUP.HEADERS", true);
ppt.showRating = window.GetProperty("SMOOTH.SHOW.RATING", true);

ppt.defaultRowHeight = window.GetProperty("SMOOTH.ROW.HEIGHT", 35);
ppt.rowHeight = ppt.defaultRowHeight;

if (ppt.groupHeaderRowsNumber < 1) ppt.groupHeaderRowsNumber = 1;
else if (ppt.groupHeaderRowsNumber > 3) ppt.groupHeaderRowsNumber = 3;

var tfo = {
	artist_title : fb.TitleFormat("%artist% ^^ %title%"),
	track : fb.TitleFormat("[%artist%] ^^ [%title%] ^^ [[%discnumber%.]%tracknumber%.] ^^ [%length%] ^^ $if2(%rating%,0)"),
	time : fb.TitleFormat("$if3(-%playback_time_remaining%,%playback_time%,)"),
	groupkey : fb.TitleFormat(ppt.groupkey_tf + " ^^ $crc32(%path%)"),
}

var foo_playcount = fb.CheckComponent("foo_playcount");

var g_active_playlist = plman.ActivePlaylist;
var g_focus_id = getFocusId();
var g_focus_row = 0;
var g_focus_album_id = -1;
var g_seconds = 0;
var g_time = "";

var g_selHolder = fb.AcquireSelectionHolder();
g_selHolder.SetPlaylistSelectionTracking();
plman.SetActivePlaylistContext();

var brw = new oBrowser();

get_metrics();
setWallpaperImg();
