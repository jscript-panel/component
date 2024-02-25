function on_char(code) {
	if (brw.inputboxID >= 0) {
		brw.inputbox.on_char(code);
	}
}

function on_drag_drop(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (g_drag_drop_target_id > -1) {
			if (playlist_can_add_items(g_drag_drop_target_id)) {
				action.Playlist = g_drag_drop_target_id;
				action.Base = plman.GetPlaylistItemCount(g_drag_drop_target_id);
				action.ToSelect = false;
				action.Effect = 1;
			} else {
				action.Effect = 0;
			}
		} else {
			action.Playlist = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items");;
			action.Base = 0;
			action.ToSelect = true;
			action.Effect = 1;
		}
	}
	g_drag_drop_target_id = -1;
	brw.repaint();
}

function on_drag_leave() {
	g_drag_drop_target_id = -1;
	if (cScrollBar.timerID) {
		window.ClearInterval(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}
	brw.repaint();
}

function on_drag_over(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		g_drag_drop_target_id = -1;
		brw.on_mouse("drag_over", x, y);
		if (g_drag_drop_target_id > -1) {
			action.Effect = playlist_can_add_items(g_drag_drop_target_id) ? 1 : 0;
		} else {
			action.Effect = 1;
		}
	}
	brw.repaint();
}

function on_focus(is_focused) {
	if (brw.inputboxID >= 0) {
		brw.inputbox.on_focus(is_focused);
	}
	if (!is_focused) {
		brw.inputboxID = -1;
		brw.repaint();
	}
}

function on_key_down(vkey) {
	if (brw.inputboxID >= 0) {
		if (vkey == VK_ESCAPE) brw.inputboxID = -1;
		brw.inputbox.on_key_down(vkey);
	} else {
		var mask = GetKeyboardMask();

		if (mask == KMask.none) {
			if (brw.rows.length == 0) return;

			switch (vkey) {
			case VK_F2:
				if (playlist_can_rename(brw.selectedRow)) {
					brw.edit_playlist(brw.rows[brw.selectedRow].idx);
				}
				break;
			case VK_F3:
				brw.showActivePlaylist();
				break;
			case VK_RETURN:
				if (brw.selectedRow > -1 && brw.selectedRow < plman.PlaylistCount) {
					plman.ActivePlaylist = brw.selectedRow;
					brw.repaint();
				}
				break;
			case VK_DELETE:
				if (brw.selectedRow >= 0 && brw.selectedRow < plman.PlaylistCount) {
					plman.RemovePlaylistSwitch(brw.selectedRow);
				}
				break;
			case VK_UP:
				if (brw.selectedRow > 0) {
					brw.selectedRow--;
					brw.showSelectedPlaylist();
					brw.repaint();
				}
				break;
			case VK_DOWN:
				if (brw.selectedRow < brw.rows.length - 1) {
					brw.selectedRow++;
					brw.showSelectedPlaylist();
					brw.repaint();
				}
				break;
			case VK_HOME:
				brw.selectedRow = 0;
				brw.showSelectedPlaylist();
				brw.repaint();
				break;
			case VK_END:
				brw.selectedRow = brw.rows.length - 1;
				brw.showSelectedPlaylist();
				brw.repaint();
				break;
			}
		} else if (mask == KMask.ctrl) {
			if (vkey == 48) { // CTRL+0
				if (ppt.extra_font_size > 0) {
					ppt.extra_font_size = 0;
					window.SetProperty("SMOOTH.EXTRA.FONT.SIZE", ppt.extra_font_size);
					get_font();
					get_metrics();
					get_images();
					brw.repaint();
				}
			} else if (vkey == 84) { // CTRL+T
				ppt.showHeaderBar = !ppt.showHeaderBar;
				window.SetProperty("SMOOTH.SHOW.TOP.BAR", ppt.showHeaderBar);
				get_metrics();
				brw.repaint();
			}
		}
	}
}

function on_key_up(vkey) {
	cScrollBar.timerCounter = -1;
	if (cScrollBar.timerID) {
		window.ClearTimeout(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}
	brw.repaint();
}

function on_mouse_lbtn_down(x, y) {
	brw.on_mouse("lbtn_down", x, y);
}

function on_mouse_lbtn_up(x, y) {
	brw.on_mouse("lbtn_up", x, y);
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	if (y < brw.y) {
		brw.showActivePlaylist();
	} else {
		brw.on_mouse("lbtn_dblclk", x, y);
	}
}

function on_mouse_rbtn_up(x, y) {
	brw.on_mouse("rbtn_up", x, y);
	return true;
}

function on_mouse_move(x, y) {
	if (m_x == x && m_y == y)
		return;

	brw.on_mouse("move", x, y);

	m_x = x;
	m_y = y;
}

function on_mouse_wheel(step) {
	if (utils.IsKeyPressed(VK_CONTROL)) {
		brw.inputboxID = -1;
		update_extra_font_size(step);
	} else {
		scroll -= step * ppt.rowHeight * ppt.rowScrollStep;
		scroll = check_scroll(scroll);
		brw.on_mouse("wheel", m_x, m_y, step);
	}
}

function on_paint(gr) {
	gr.Clear(g_colour_background);
	if (ppt.wallpapermode != 0 && g_wallpaperImg) {
		drawImage(gr, g_wallpaperImg, brw.x, brw.y, brw.w, brw.h, true, null, ppt.wallpaperopacity);
	}

	brw.draw(gr);
}

function on_playback_dynamic_info_track(type) {
	if (type == 1) {
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
	setWallpaperImg();

	if (ppt.enableDynamicColours) {
		on_colours_changed();
	}

	brw.repaint();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		setWallpaperImg();
		if (ppt.enableDynamicColours) {
			on_colours_changed();
		}
	}
	brw.repaint();
}

function on_playlist_items_added() {
	brw.repaint();
}

function on_playlist_items_removed() {
	brw.repaint();
}

function on_playlist_switch() {
	brw.showActivePlaylist();
	if (brw.selectedRow >= brw.rows.length)
		brw.selectedRow = plman.ActivePlaylist;
	brw.repaint();
}

function on_playlists_changed() {
	brw.populate();
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

		if (this.inputboxID > -1) {
			var rh = ppt.rowHeight - 10;
			var tw = this.w - rh - 10;
			if (this.inputbox) {
				this.inputbox.setSize(tw, rh);
			}
		}

		this.scrollbar.setSize();

		scroll = Math.round(scroll / ppt.rowHeight) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		scroll_ = scroll;

		this.scrollbar.updateScrollbar();
	}

	this.getlimits = function () {
		if (this.rows.length <= this.totalRowsVis) {
			var start_ = 0;
			var end_ = this.rows.length - 1;
		} else {
			if (scroll_ < 0)
				scroll_ = scroll;
			var start_ = Math.round(scroll_ / ppt.rowHeight + 0.4);
			var end_ = start_ + this.totalRows;
			start_ = start_ > 0 ? start_ - 1 : start_;
			if (start_ < 0)
				start_ = 0;
			if (end_ >= this.rows.length)
				end_ = this.rows.length - 1;
		}
		g_start_ = start_;
		g_end_ = end_;
	}

	this.populate = function () {
		var total = plman.PlaylistCount;
		this.rows = [];

		for (var i = 0; i < total; i++) {
			var name = plman.GetPlaylistName(i);
			this.rows.push(new oPlaylist(i, name));
		}

		if (this.selectedRow >= this.rows.length)
			this.selectedRow = plman.ActivePlaylist;

		this.scrollbar.updateScrollbar();
		this.repaint();
	}

	this.getRowIdFromIdx = function (idx) {
		var total = this.rows.length;
		var rowId = -1;
		if (plman.PlaylistCount > 0) {
			for (var i = 0; i < total; i++) {
				if (this.rows[i].idx == idx) {
					rowId = i;
					break;
				}
			}
		}
		return rowId;
	}

	this.isVisiblePlaylist = function (idx) {
		var rowId = this.getRowIdFromIdx(idx);
		var offset_active_pl = ppt.rowHeight * rowId;
		if (offset_active_pl < scroll || offset_active_pl + ppt.rowHeight > scroll + this.h) {
			return false;
		} else {
			return true;
		}
	}

	this.showSelectedPlaylist = function () {
		var rowId = this.getRowIdFromIdx(this.selectedRow);

		if (!this.isVisiblePlaylist(this.selectedRow)) {
			scroll = (rowId - Math.floor(this.totalRowsVis / 2)) * ppt.rowHeight;
			scroll = check_scroll(scroll);
			this.scrollbar.updateScrollbar();
		}
	}

	this.showActivePlaylist = function () {
		var rowId = this.getRowIdFromIdx(plman.ActivePlaylist);

		if (!this.isVisiblePlaylist(plman.ActivePlaylist)) {
			scroll = (rowId - Math.floor(this.totalRowsVis / 2)) * ppt.rowHeight;
			scroll = check_scroll(scroll);
			this.scrollbar.updateScrollbar();
		}
	}

	this.draw = function (gr) {
		if (this.rows.length != plman.PlaylistCount) this.populate();
		this.getlimits();

		if (this.rows.length > 0) {
			var ax = 0;
			var ay = 0;
			var aw = this.w;
			var ah = ppt.rowHeight;

			for (var i = g_start_; i <= g_end_; i++) {
				ay = Math.floor(this.y + (i * ah) - scroll_);
				var normal_text = g_colour_text;

				if (i % 2 != 0) {
					gr.FillRectangle(ax, ay, aw, ah, setAlpha(g_colour_text, 8));
				}

				if (this.rows[i].idx == plman.ActivePlaylist) {
					drawSelectedRectangle(gr, ax, ay, aw, ah);
					normal_text = g_colour_selected_text;
				} else if (i == this.selectedRow) {
					gr.DrawRectangle(ax + 1, ay + 1, aw - 2, ah - 2, 2.0, g_colour_selection);
				}

				if (cPlaylistManager.drag_target_id == i) {
					if (cPlaylistManager.drag_target_id > cPlaylistManager.drag_source_id) {
						gr.DrawRectangle(ax, ay + ppt.rowHeight - 2, aw - 1, 1, 2.0, g_colour_selection);
					} else if (cPlaylistManager.drag_target_id < cPlaylistManager.drag_source_id) {
						gr.DrawRectangle(ax, ay + 1, aw - 1, 1, 2.0, g_colour_selection);
					}
				}

				if (i == g_drag_drop_target_id && playlist_can_add_items(i)) {
					gr.DrawRectangle(ax + 1, ay + 1, aw - 2, ah - 2, 2.0, g_colour_text & 0xa0ffffff);
				}

				if (plman.IsPlaylistLocked(this.rows[i].idx))
				{
					gr.WriteText(chars.lock, g_font_fluent_20, normal_text, ax + scale(5), ay, ah, ah, 0, 2);
				}
				else
				{
					gr.WriteText(chars.menu, g_font_fluent_20, normal_text, ax + scale(7), ay, ah, ah, 0, 2);
				}

				if (this.inputboxID == i) {
					this.inputbox.draw(gr, ah, ay + 5);
				} else {
					gr.WriteText(this.rows[i].name, g_font, normal_text, ah, ay, aw - (ah * 3), ah, 0, 2, 1, 1);
					gr.WriteText(plman.GetPlaylistItemCount(this.rows[i].idx), g_font, normal_text, ah, ay, aw - ah - 5, ah, 1, 2, 1, 1);
				}
			}
		}

		this.scrollbar.draw(gr);

		if (ppt.showHeaderBar) {
			var boxText = this.rows.length + " playlist";
			if (this.rows.length != 1) boxText += "s";
			draw_header_bar(gr, boxText, this);
		}
	}

	this._isHover = function (x, y) {
		return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
	}

	this.on_mouse = function (event, x, y) {
		this.ishover = this._isHover(x, y);

		if (y > this.y && y < this.y + this.h) {
			this.activeRow = Math.ceil((y + scroll_ - this.y) / ppt.rowHeight - 1);
			if (this.activeRow >= this.rows.length)
				this.activeRow = -1;
		} else {
			this.activeRow = -1;
		}

		switch (event) {
		case "lbtn_down":
			this.down = true;
			if (this.ishover && this.activeRow > -1 && Math.abs(scroll - scroll_) < 2) {
				this.selectedRow = this.activeRow;
				if (this.activeRow == this.inputboxID) {
					this.inputbox.check("lbtn_down", x, y);
				} else {
					if (this.inputboxID > -1)
						this.inputboxID = -1;
					if (!this.up) {
						cPlaylistManager.drag_clicked = true;
						cPlaylistManager.drag_source_id = this.selectedRow;
					}
				}
				this.repaint();
			} else {
				if (this.inputboxID > -1)
					this.inputboxID = -1;
			}
			this.up = false;
			break;
		case "lbtn_up":
			this.up = true;
			if (this.down) {
				if (this.inputboxID >= 0) {
					this.inputbox.check("lbtn_up", x, y);
				} else if (cPlaylistManager.drag_target_id > -1 && cPlaylistManager.drag_target_id != cPlaylistManager.drag_source_id) {
					plman.MovePlaylist(this.rows[cPlaylistManager.drag_source_id].idx, this.rows[cPlaylistManager.drag_target_id].idx);
					this.selectedRow = cPlaylistManager.drag_target_id;
				}

				if (timers.movePlaylist) {
					window.ClearInterval(timers.movePlaylist);
					timers.movePlaylist = false;
				}
			}

			this.down = false;

			if (cPlaylistManager.drag_moved)
				window.SetCursor(IDC_ARROW);

			cPlaylistManager.drag_clicked = false;
			cPlaylistManager.drag_moved = false;
			cPlaylistManager.drag_source_id = -1;
			cPlaylistManager.drag_target_id = -1;
			break;
		case "lbtn_dblclk":
			if (this.ishover && this.activeRow > -1 && Math.abs(scroll - scroll_) < 2) {
				if (plman.ActivePlaylist != this.rows[this.activeRow].idx) {
					if (this.inputboxID > -1)
						this.inputboxID = -1;
					this.repaint();
					plman.ActivePlaylist = this.rows[this.activeRow].idx;
				}
			}
			break;
		case "move":
			this.up = false;
			if (this.inputboxID >= 0) {
				this.inputbox.check("move", x, y);
			} else {
				if (cPlaylistManager.drag_clicked) {
					cPlaylistManager.drag_moved = true;
				}
				if (cPlaylistManager.drag_moved) {
					window.SetCursor(IDC_HELP);
					if (this.activeRow > -1) {
						if (timers.movePlaylist) {
							window.ClearInterval(timers.movePlaylist);
							timers.movePlaylist = false;
						}
						if (this.activeRow != cPlaylistManager.drag_source_id) {
							cPlaylistManager.drag_target_id = this.activeRow;
						} else {
							cPlaylistManager.drag_target_id = -1;
						}
					} else {
						if (y < this.y) {
							if (!timers.movePlaylist) {
								timers.movePlaylist = window.SetInterval(function () {
									scroll -= ppt.rowHeight;
									scroll = check_scroll(scroll);
									cPlaylistManager.drag_target_id = cPlaylistManager.drag_target_id > 0 ? cPlaylistManager.drag_target_id - 1 : 0;
								}, 100);
							}
						} else if (y > this.y + this.h) {
							if (!timers.movePlaylist) {
								timers.movePlaylist = window.SetInterval((function () {
									scroll += ppt.rowHeight;
									scroll = check_scroll(scroll);
									cPlaylistManager.drag_target_id = cPlaylistManager.drag_target_id < this.rows.length - 1 ? cPlaylistManager.drag_target_id + 1 : this.rows.length - 1;
								}).bind(this), 100);
							}
						}
					}
					this.repaint();
				}
			}
			break;
		case "rbtn_up":
			if (this.inputboxID >= 0) {
				if (!this.inputbox.hover) {
					this.inputboxID = -1;
					this.on_mouse("rbtn_up", x, y);
				} else {
					this.inputbox.check("rbtn_up", x, y);
				}
			} else {
				if (this.ishover) {
					if (this.activeRow > -1 && Math.abs(scroll - scroll_) < 2) {
						this.repaint();
						this.selectedRow = this.activeRow;
						this.context_menu(x, y, this.selectedRow);
					} else {
						this.context_menu(x, y, this.activeRow);
					}
				} else {
					this.settings_context_menu(x, y);
				}
			}
			break;
		case "drag_over":
			if (this.rows.length > 0 && this.activeRow > -1) {
				g_drag_drop_target_id = this.activeRow;
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

	this.edit_playlist = function (p) {
		var rh = ppt.rowHeight - 10;
		var tw = this.w - rh - 100;
		this.inputbox = new oInputbox(tw, rh, false, plman.GetPlaylistName(p), "", "renamePlaylist()");
		this.inputbox.setSize(tw, rh);
		this.inputboxID = p;
		this.inputbox.on_focus(true);
		this.inputbox.edit = true;
		this.inputbox.Cpos = this.inputbox.text.length;
		this.inputbox.anchor = this.inputbox.Cpos;
		this.inputbox.SelBegin = this.inputbox.Cpos;
		this.inputbox.SelEnd = this.inputbox.Cpos;
		if (!cInputbox.timer_cursor) {
			this.inputbox.resetCursorTimer();
		}
		this.inputbox.dblclk = true;
		this.inputbox.SelBegin = 0;
		this.inputbox.SelEnd = this.inputbox.text.length;
		this.inputbox.text_selected = this.inputbox.text;
		this.inputbox.select = true;
		this.repaint();
	}

	this.context_menu = function (x, y, id) {
		var menu = window.CreatePopupMenu();
		var newplaylist = window.CreatePopupMenu();
		var autoplaylist = window.CreatePopupMenu();
		var restore = window.CreatePopupMenu();
		var items = window.CreatePopupMenu();
		var context = fb.CreateContextMenuManager();

		var count = plman.PlaylistCount;
		var recycler_count = plman.RecyclerCount;
		var history = [];

		for (var i = 0; i < autoplaylists.length; i++) {
			autoplaylist.AppendMenuItem(MF_STRING, 200 + i, autoplaylists[i][0]);
		}

		menu.AppendMenuItem(MF_STRING, 100, "Load Playlist...");
		newplaylist.AppendMenuItem(MF_STRING, 101, "New Playlist");
		newplaylist.AppendMenuItem(MF_STRING, 102, "New Autoplaylist");
		autoplaylist.AppendTo(newplaylist, MF_STRING, "Preset AutoPlaylists");
		newplaylist.AppendTo(menu, MF_STRING, "Add");

		if (recycler_count > 0) {
			for (var i = 0; i < recycler_count; i++) {
				history.push(i);
				restore.AppendMenuItem(MF_STRING, 10 + i, plman.GetRecyclerName(i));
			}
			restore.AppendMenuSeparator();
			restore.AppendMenuItem(MF_STRING, 99, "Clear history");
			restore.AppendTo(menu, MF_STRING, "Restore");
		}
		menu.AppendMenuSeparator();
		menu.AppendMenuItem(EnableMenuIf(count > 1), 1, "Sort playlists A-Z");
		menu.AppendMenuItem(EnableMenuIf(count > 1), 2, "Sort playlists Z-A");

		if (id > -1) {
			menu.AppendMenuSeparator();
			var lock_name = plman.GetPlaylistLockName(id);

			menu.AppendMenuItem(MF_STRING, 3, "Duplicate this playlist");
			menu.AppendMenuItem(EnableMenuIf(playlist_can_rename(id)), 4, "Rename this playlist\tF2");
			menu.AppendMenuItem(EnableMenuIf(playlist_can_remove(id)), 5, "Remove this playlist\tDel");
			menu.AppendMenuSeparator();
			if (plman.IsAutoPlaylist(id)) {
				menu.AppendMenuItem(MF_STRING, 6, lock_name + " properties");
				menu.AppendMenuItem(MF_STRING, 7, "Convert to a normal playlist");
			} else {
				var is_locked = plman.IsPlaylistLocked(id);
				var is_mine = lock_name == "JScript Panel 3";

				menu.AppendMenuItem(EnableMenuIf(is_mine || !is_locked), 8, "Edit playlist lock...");
				menu.AppendMenuItem(EnableMenuIf(is_mine), 9, "Remove playlist lock");
			}
			var playlist_items = plman.GetPlaylistItems(id);
			if (playlist_items.Count > 0) {
				menu.AppendMenuSeparator();
				context.InitContext(playlist_items);
				context.BuildMenu(items, 1000);
				items.AppendTo(menu, MF_STRING, 'Items');
			}
		}

		var idx = menu.TrackPopupMenu(x, y);
		menu.Dispose();

		switch (true) {
		case idx == 0:
			break;
		case idx == 1:
			plman.SortPlaylistsByName(1);
			break;
		case idx == 2:
			plman.SortPlaylistsByName(-1);
			break;
		case idx == 3:
			plman.ActivePlaylist = plman.DuplicatePlaylist(id, "Copy of " + plman.GetPlaylistName(id));
			break;
		case idx == 4:
			this.edit_playlist(id);
			break;
		case idx == 5:
			plman.RemovePlaylistSwitch(id);
			break;
		case idx == 6:
			plman.ShowAutoPlaylistUI(id);
			break;
		case idx == 7:
			plman.ActivePlaylist = plman.DuplicatePlaylist(id, plman.GetPlaylistName(id));
			plman.RemovePlaylist(id);
			break;
		case idx == 8:
			plman.ShowPlaylistLockUI(id);
			break;
		case idx == 9:
			plman.RemovePlaylistLock(id);
			break;
		case idx >= 10 && idx <= 98:
			plman.RecyclerRestore(idx - 10);
			plman.ActivePlaylist = plman.PlaylistCount - 1;
			break;
		case idx == 99:
			plman.RecyclerPurge(history);
			break;
		case idx == 100:
			fb.LoadPlaylist();
			break;
		case idx == 101:
			var p = plman.CreatePlaylist();
			plman.ActivePlaylist = p;
			this.edit_playlist(p);
			break;
		case idx == 102:
			var p = plman.CreateAutoPlaylist(plman.PlaylistCount, "", "enter your query here");
			plman.ActivePlaylist = p;
			plman.ShowAutoPlaylistUI(p);
			this.edit_playlist(p);
			break;
		case idx >= 200 && idx < 200 + autoplaylists.length:
			var item = autoplaylists[idx - 200];
			plman.ActivePlaylist = plman.CreateAutoPlaylist(plman.PlaylistCount, item[0], item[1], ppt.autoplaylist_sort_pattern);
			break;
		case idx >= 1000:
			context.ExecuteByID(idx - 1000);
			break;
		}

		context.Dispose();
		this.repaint();
		return true;
	}

	this.settings_context_menu = function (x, y) {
		var menu = window.CreatePopupMenu();
		var sub1 = window.CreatePopupMenu();
		var sub2 = window.CreatePopupMenu();

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
		case 50:
			window.ShowConfigure();
			break;
		}
		return true;
	}

	window.SetTimeout(function () {
		brw.populate();
	}, 100);

	this.rows = [];
	this.scrollbar = new oScrollbar();
	this.inputbox = null;
	this.inputboxID = -1;
	this.selectedRow = plman.ActivePlaylist;
}

function oPlaylist(idx, name) {
	this.idx = idx;
	this.rowId = idx;
	this.name = name;
	this.y = -1;
}

function get_metrics() {
	if (ppt.showHeaderBar) {
		ppt.headerBarHeight = scale(ppt.defaultHeaderBarHeight);
	} else {
		ppt.headerBarHeight = 0;
	}

	ppt.rowHeight = scale(ppt.defaultRowHeight);
	cScrollBar.width = scale(cScrollBar.defaultWidth);
	cScrollBar.minCursorHeight = scale(cScrollBar.defaultMinCursorHeight);

	brw.setSize();
}

function check_scroll(scroll___) {
	if (scroll___ < 0)
		scroll___ = 0;
	var g1 = brw.h - (brw.totalRowsVis * ppt.rowHeight);
	var end_limit = (brw.rows.length * ppt.rowHeight) - (brw.totalRowsVis * ppt.rowHeight) - g1;
	if (scroll___ != 0 && scroll___ > end_limit) {
		scroll___ = end_limit;
	}
	return scroll___;
}

function renamePlaylist() {
	if (!brw.inputbox.text || brw.inputbox.text == "" || brw.inputboxID == -1)
		brw.inputbox.text = brw.rows[brw.inputboxID].name;
	if (brw.inputbox.text.length > 1 || (brw.inputbox.text.length == 1 && (brw.inputbox.text >= "a" && brw.inputbox.text <= "z") || (brw.inputbox.text >= "A" && brw.inputbox.text <= "Z") || (brw.inputbox.text >= "0" && brw.inputbox.text <= "9"))) {
		brw.rows[brw.inputboxID].name = brw.inputbox.text;
		plman.RenamePlaylist(brw.rows[brw.inputboxID].idx, brw.inputbox.text);
		brw.repaint();
	}
	brw.inputboxID = -1;
}

ppt.defaultRowHeight = window.GetProperty("SMOOTH.ROW.HEIGHT", 35);
ppt.rowHeight = ppt.defaultRowHeight;
ppt.autoplaylist_sort_pattern = "%album artist% | $if(%album%,%date%,9999) | %album% | %discnumber% | %tracknumber% | %title%";

var autoplaylists = [
	["Media Library", "ALL"],
	["Tracks never played", "%play_count% MISSING"],
	["Tracks played in the last 5 days", "%last_played% DURING LAST 5 DAYS"],
	["Tracks unrated", "%rating% MISSING"],
	["Tracks rated 1", "%rating% IS 1"],
	["Tracks rated 2", "%rating% IS 2"],
	["Tracks rated 3", "%rating% IS 3"],
	["Tracks rated 4", "%rating% IS 4"],
	["Tracks rated 5", "%rating% IS 5"],
];

var cPlaylistManager = {
	drag_clicked: false,
	drag_source_id: -1,
	drag_target_id: -1,
}

var timers = {
	movePlaylist: false,
};

var g_drag_drop_target_id = -1;
var brw = new oBrowser();

get_metrics();
setWallpaperImg();
