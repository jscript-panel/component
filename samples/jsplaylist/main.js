function on_char(code) {
	if (cSettings.visible) {
		for (var i = 0; i < p.settings.pages.length; i++) {
			for (var j = 0; j < p.settings.pages[i].elements.length; j++) {
				if (p.settings.pages[i].elements[j].objType == "TB") p.settings.pages[i].elements[j].on_char(code);
			}
		}
	} else if (p.playlistManager.inputboxID >= 0) {
		p.playlistManager.inputbox.on_char(code);
	}
}

function on_colours_changed() {
	get_colours();
	p.topBar.setButtons();
	p.headerBar.setButtons();
	p.scrollbar.setButtons();
	p.scrollbar.setCursorButton();
	p.playlistManager.setButtons();
	p.settings.setButtons();
	resize_panels();
	window.Repaint();
}

function on_drag_drop(action, x, y, mask) {
	if (y < p.list.y) {
		action.Effect = 0;
	} else if (cPlaylistManager.visible && p.playlistManager.isHoverObject(x, y)) {
		if (g_drag_drop_playlist_id == -1) {
			if (p.playlistManager.ishoverHeader) {
				if (g_drag_drop_internal) {
					var pl = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items")
					plman.InsertPlaylistItems(pl, 0, plman.GetPlaylistSelectedItems(g_active_playlist));
					action.Effect = 0;
				} else {
					action.Playlist = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items");
					action.Base = 0;
					action.ToSelect = false;
					action.Effect = 1;
				}
			} else {
				action.Effect = 0;
			}
		} else if (playlist_can_add_items(g_drag_drop_playlist_id)) {
			var base = plman.GetPlaylistItemCount(g_drag_drop_playlist_id);

			if (g_drag_drop_internal) {
				if (g_drag_drop_playlist_id != g_active_playlist) {
					plman.UndoBackup(g_drag_drop_playlist_id);
					plman.InsertPlaylistItems(g_drag_drop_playlist_id, base, plman.GetPlaylistSelectedItems(g_active_playlist));
				}
				action.Effect = 0;
			} else {
				plman.UndoBackup(g_drag_drop_playlist_id);
				action.Playlist = g_drag_drop_playlist_id;
				action.Base = base;
				action.ToSelect = false;
				action.Effect = 1;
			}
		} else {
			action.Effect = 0;
		}
	} else {
		var new_pos = g_drag_drop_bottom ? plman.GetPlaylistItemCount(g_active_playlist) : g_drag_drop_track_id;
		if (g_drag_drop_internal) {
			plman.UndoBackup(g_active_playlist);
			plman.MovePlaylistSelectionV2(g_active_playlist, new_pos);
			action.Effect = 0;
		} else if (playlist_can_add_items(g_active_playlist)) {
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.UndoBackup(g_active_playlist);
			action.Playlist = g_active_playlist;
			action.Base = new_pos;
			action.ToSelect = true;
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}
	g_drag_drop_playlist_manager_hover = false;
	g_drag_drop_playlist_id = -1;
	g_drag_drop_track_id = -1;
	g_drag_drop_row_id = -1;
	g_drag_drop_bottom = false;
	g_drag_drop_internal = false;
	full_repaint();
}

function on_drag_enter() {
	g_drag_drop_status = true;
}

function on_drag_leave() {
	g_drag_drop_status = false;
	g_drag_drop_playlist_manager_hover = false;
	g_drag_drop_track_id = -1;
	g_drag_drop_row_id = -1;
	g_drag_drop_playlist_id = -1;
	p.list.buttonclicked = false;
	if (cScrollBar.interval) {
		window.ClearInterval(cScrollBar.interval);
		cScrollBar.interval = false;
	}
	window.Repaint();
}

function on_drag_over(action, x, y, mask) {
	g_drag_drop_playlist_manager_hover = false;
	g_drag_drop_track_id = -1;
	g_drag_drop_row_id = -1;
	g_drag_drop_bottom = false;

	if (y < p.list.y) {
		action.Effect = 0;
	} else if (cPlaylistManager.visible && p.playlistManager.isHoverObject(x, y)) {
		g_drag_drop_playlist_manager_hover = true;
		p.playlistManager.check("drag_over", x, y);
		if (g_drag_drop_playlist_id == -1) {
			action.Effect = p.playlistManager.ishoverHeader ? 1 : 0;
		} else if (g_drag_drop_internal) {
			action.Effect = g_drag_drop_playlist_id == g_active_playlist ? 0 : 1;
		} else if (playlist_can_add_items(g_drag_drop_playlist_id)) {
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	} else if (g_drag_drop_internal || playlist_can_add_items(g_active_playlist)) {
		p.list.check("drag_over", x, y);
		if (y > p.list.y && y < p.list.y + 40) {
			on_mouse_wheel(1);
		} else if (y > p.list.y + p.list.h - 40 && y < p.list.y + p.list.h) {
			on_mouse_wheel(-1);
		}
		action.Effect = 1;
	} else {
		action.Effect = 0;
	}
	full_repaint();
}

function on_focus(is_focused) {
	if (p.playlistManager.inputboxID >= 0) {
		p.playlistManager.inputbox.on_focus(is_focused);
	}
	if (is_focused) {
		plman.SetActivePlaylistContext();
		g_selHolder.SetPlaylistSelectionTracking();
	} else {
		p.playlistManager.inputboxID = -1;
		full_repaint();
	}
}

function on_font_changed() {
	get_font();
	p.topBar.setButtons();
	p.headerBar.setButtons();
	p.scrollbar.setButtons();
	p.scrollbar.setCursorButton();
	p.playlistManager.setButtons();
	p.settings.setButtons();
	resize_panels();
	window.Repaint();
}

function on_get_album_art_done(metadb, art_id, image) {
	for (var i = 0; i < p.list.groups.length; i++) {
		var group = p.list.groups[i];
		if (group.metadb && group.metadb.Compare(metadb)) {
			g_image_cache.set(metadb, image, group.group_key);
			break;
		}
	}
}

function on_item_focus_change(playlist, from, to) {
	if (playlist == g_active_playlist) {
		p.list.focusedTrackId = to;
		var center_focus_item = p.list.isFocusedItemVisible();
		if ((!center_focus_item && !p.list.drawRectSel) || (center_focus_item && to == 0)) {
			p.list.setItems(true);
		}
		p.scrollbar.setCursor(p.list.totalRowVisible, p.list.totalRows, p.list.offset);
	}
	full_repaint();
}

function on_key_down(vkey) {
	if (cSettings.visible) {
		g_textbox_tabbed = false;
		var elements = p.settings.pages[p.settings.currentPageId].elements;
		for (var j = 0; j < elements.length; j++) {
			if (typeof elements[j].on_key_down == "function") elements[j].on_key_down(vkey);
		}
	} else {
		if (p.playlistManager.inputboxID >= 0) {
			switch (vkey) {
			case VK_ESCAPE:
			case 222:
				p.playlistManager.inputboxID = -1;
				full_repaint();
				break;
			default:
				p.playlistManager.inputbox.on_key_down(vkey);
			}
		} else {
			var mask = GetKeyboardMask();
			if (mask == KMask.none) {
				switch (vkey) {
				case VK_F2:
					// rename playlist (playlist manager panel visible)
					if (cPlaylistManager.visible && playlist_can_rename(g_active_playlist)) {
						p.playlistManager.inputbox = new oInputbox(p.playlistManager.w - p.playlistManager.border - p.playlistManager.scrollbarWidth - scale(40), cPlaylistManager.rowHeight - 10, plman.GetPlaylistName(g_active_playlist), "", "renamePlaylist()");
						p.playlistManager.inputboxID = g_active_playlist;
						// activate box content + selection activated
						if (cPlaylistManager.inputbox_timeout) window.ClearTimeout(cPlaylistManager.inputbox_timeout);
						cPlaylistManager.inputbox_timeout = window.SetTimeout(inputboxPlaylistManager_activate, 20);
					}
					break;
				case VK_F5:
					p.list.groups.forEach(function (item) {
						item.cover_img = null;
					});
					g_image_cache.reset();
					full_repaint();
					break;
				case VK_TAB:
					togglePlaylistManager();
					break;
				case VK_UP:
					var scrollstep = 1;
					var new_focus_id = 0;
					if (p.list.count > 0 && !p.list.keypressed && !cScrollBar.timeout) {
						p.list.keypressed = true;
						new_focus_id = (p.list.focusedTrackId > 0) ? p.list.focusedTrackId - scrollstep : 0;
						var grpId = p.list.getGroupIdfromTrackId(new_focus_id);

						if (p.list.focusedTrackId == 0 && p.list.offset > 0) {
							p.list.scrollItems(1, scrollstep);
							cScrollBar.timeout = window.SetTimeout(function () {
								cScrollBar.timeout = false;
								p.list.scrollItems(1, scrollstep);
								if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
								cScrollBar.interval = window.SetInterval(function () {
									p.list.scrollItems(1, scrollstep);
								}, 50);
							}, 400);
						} else {
							plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
							cScrollBar.timeout = window.SetTimeout(function () {
								cScrollBar.timeout = false;
								if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
								cScrollBar.interval = window.SetInterval(function () {
									new_focus_id = (p.list.focusedTrackId > 0) ? p.list.focusedTrackId - scrollstep : 0;
									var grpId = p.list.getGroupIdfromTrackId(new_focus_id);
									plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
									plman.ClearPlaylistSelection(g_active_playlist);
									plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
								}, 50);
							}, 400);
						}
					}
					break;
				case VK_DOWN:
					if (p.list.count > 0 && !p.list.keypressed && !cScrollBar.timeout) {
						p.list.keypressed = true;
						var new_focus_id = (p.list.focusedTrackId < p.list.count - 1) ? p.list.focusedTrackId + 1 : p.list.count - 1;

						plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
						cScrollBar.timeout = window.SetTimeout(function () {
							cScrollBar.timeout = false;
							if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
							cScrollBar.interval = window.SetInterval(function () {
								new_focus_id = (p.list.focusedTrackId < p.list.count - 1) ? p.list.focusedTrackId + 1 : p.list.count - 1;
								var grpId = p.list.getGroupIdfromTrackId(new_focus_id);
								plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
							}, 50);
						}, 400);
					}
					break;
				case VK_PGUP:
					var scrollstep = p.list.totalRowVisible;
					var new_focus_id = 0;
					if (p.list.count > 0 && !p.list.keypressed && !cScrollBar.timeout) {
						p.list.keypressed = true;
						new_focus_id = (p.list.focusedTrackId > scrollstep) ? p.list.focusedTrackId - scrollstep : 0;
						if (p.list.focusedTrackId == 0 && p.list.offset > 0) {
							p.list.scrollItems(1, scrollstep);
							cScrollBar.timeout = window.SetTimeout(function () {
								cScrollBar.timeout = false;
								p.list.scrollItems(1, scrollstep);
								if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
								cScrollBar.interval = window.SetInterval(function () {
									p.list.scrollItems(1, scrollstep);
								}, 60);
							}, 400);
						} else {
							plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
							cScrollBar.timeout = window.SetTimeout(function () {
								cScrollBar.timeout = false;
								if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
								cScrollBar.interval = window.SetInterval(function () {
									new_focus_id = (p.list.focusedTrackId > scrollstep) ? p.list.focusedTrackId - scrollstep : 0;
									plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
									plman.ClearPlaylistSelection(g_active_playlist);
									plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
								}, 60);
							}, 400);
						}
					}
					break;
				case VK_PGDN:
					var scrollstep = p.list.totalRowVisible;
					var new_focus_id = 0;
					if (p.list.count > 0 && !p.list.keypressed && !cScrollBar.timeout) {
						p.list.keypressed = true;
						new_focus_id = (p.list.focusedTrackId < p.list.count - scrollstep) ? p.list.focusedTrackId + scrollstep : p.list.count - 1;
						plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
						cScrollBar.timeout = window.SetTimeout(function () {
							cScrollBar.timeout = false;
							if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
							cScrollBar.interval = window.SetInterval(function () {
								new_focus_id = (p.list.focusedTrackId < p.list.count - scrollstep) ? p.list.focusedTrackId + scrollstep : p.list.count - 1;
								plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
							}, 60);
						}, 400);
					}
					break;
				case VK_RETURN:
					plman.ExecutePlaylistDefaultAction(g_active_playlist, p.list.focusedTrackId);
					break;
				case VK_END:
					if (p.list.count > 0) {
						plman.SetPlaylistFocusItem(g_active_playlist, p.list.count - 1);
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.count - 1, true);
					}
					break;
				case VK_HOME:
					if (p.list.count > 0) {
						plman.SetPlaylistFocusItem(g_active_playlist, 0);
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, 0, true);
					}
					break;
				case VK_DELETE:
					if (playlist_can_remove_items(g_active_playlist)) {
						plman.UndoBackup(g_active_playlist);
						plman.RemovePlaylistSelection(g_active_playlist);
					}
					break;
				}
			} else {
				switch (mask) {
				case KMask.shift:
					switch (vkey) {
					case VK_SHIFT: // SHIFT key alone
						p.list.SHIFT_count = 0;
						break;
					case VK_UP: // SHIFT + KEY UP
						if (p.list.SHIFT_count == 0) {
							if (p.list.SHIFT_start_id == null) {
								p.list.SHIFT_start_id = p.list.focusedTrackId;
							}
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
							if (p.list.focusedTrackId > 0) {
								p.list.SHIFT_count--;
								p.list.focusedTrackId--;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else if (p.list.SHIFT_count < 0) {
							if (p.list.focusedTrackId > 0) {
								p.list.SHIFT_count--;
								p.list.focusedTrackId--;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else {
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, false);
							p.list.SHIFT_count--;
							p.list.focusedTrackId--;
							plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
						}
						break;
					case VK_DOWN: // SHIFT + KEY DOWN
						if (p.list.SHIFT_count == 0) {
							if (p.list.SHIFT_start_id == null) {
								p.list.SHIFT_start_id = p.list.focusedTrackId;
							}
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
							if (p.list.focusedTrackId < p.list.count - 1) {
								p.list.SHIFT_count++;
								p.list.focusedTrackId++;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else if (p.list.SHIFT_count > 0) {
							if (p.list.focusedTrackId < p.list.count - 1) {
								p.list.SHIFT_count++;
								p.list.focusedTrackId++;
								plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
							}
						} else {
							plman.SetPlaylistSelectionSingle(g_active_playlist, p.list.focusedTrackId, false);
							p.list.SHIFT_count++;
							p.list.focusedTrackId++;
							plman.SetPlaylistFocusItem(g_active_playlist, p.list.focusedTrackId);
						}
						break;
					}
					break;
				case KMask.ctrl:
					if (vkey == 65) { // CTRL+A
						fb.RunMainMenuCommand("Edit/Select all");
						full_repaint();
					}
					if (vkey == 88) { // CTRL+X
						if (playlist_can_remove_items(g_active_playlist)) {
							var items = plman.GetPlaylistSelectedItems(g_active_playlist);
							if (items.CopyToClipboard()) {
								plman.UndoBackup(g_active_playlist);
								plman.RemovePlaylistSelection(g_active_playlist);
							}
							items.Dispose();
						}
					}
					if (vkey == 67) { // CTRL+C
						var items = plman.GetPlaylistSelectedItems(g_active_playlist);
						items.CopyToClipboard();
						items.Dispose();
					}
					if (vkey == 86) { // CTRL+V
						if (playlist_can_add_items(g_active_playlist) && fb.CheckClipboardContents()) {
							var clipboard_contents = fb.GetClipboardContents();
							plman.UndoBackup(g_active_playlist);
							plman.InsertPlaylistItems(g_active_playlist, p.list.focusedTrackId + 1, clipboard_contents);
							clipboard_contents.Dispose();
						}
					}
					if (vkey == 73) { // CTRL+I
						cTopBar.visible = !cTopBar.visible;
						window.SetProperty("JSPLAYLIST.TopBar.Visible", cTopBar.visible);
						resize_panels();
						full_repaint();
					}
					if (vkey == 84) { // CTRL+T
						// Toggle Toolbar
						if (!p.on_key_timeout) {
							cHeaderBar.locked = !cHeaderBar.locked;
							window.SetProperty("JSPLAYLIST.HEADERBAR2.Locked", cHeaderBar.locked);
							if (!cHeaderBar.locked) {
								p.headerBar.visible = false;
							}
							resize_panels();
							full_repaint();
							p.on_key_timeout = window.SetTimeout(function () {
								p.on_key_timeout = false;
							}, 300);
						}
					}
					if (vkey == 89) { // CTRL+Y
						fb.RunMainMenuCommand("Edit/Redo");
					}
					if (vkey == 90) { // CTRL+Z
						fb.RunMainMenuCommand("Edit/Undo");
					}
					break;
				}
			}
		}
	}
}

function on_key_up(vkey) {
	if (!cSettings.visible) {
		p.list.keypressed = false;
		if (cScrollBar.timeout) {
			window.ClearTimeout(cScrollBar.timeout);
			cScrollBar.timeout = false;
		}
		if (cScrollBar.interval) {
			window.ClearInterval(cScrollBar.interval);
			cScrollBar.interval = false;
		}
		if (vkey == VK_SHIFT) {
			p.list.SHIFT_start_id = null;
			p.list.SHIFT_count = 0;
		}
	}
}

function on_metadb_changed(handles, fromhook) {
	p.list.setItems(false);
	full_repaint();
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	if (cSettings.visible) {
		p.settings.on_mouse("lbtn_dblclk", x, y);
	} else {
		p.list.check("lbtn_dblclk", x, y);

		if (p.headerBar.visible)
			p.headerBar.on_mouse("lbtn_dblclk", x, y);

		if (cPlaylistManager.visible) {
			p.playlistManager.check("lbtn_dblclk", x, y);
		} else {
			if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
				p.scrollbar.check("lbtn_dblclk", x, y);
				if (p.scrollbar.hover) {
					on_mouse_lbtn_down(x, y);
				}
			}
		}
	}
}

function on_mouse_lbtn_down(x, y) {
	// check settings
	if (cSettings.visible) {
		p.settings.on_mouse("lbtn_down", x, y);
	} else {
		// check list
		p.list.check("lbtn_down", x, y);

		// check scrollbar
		if (!cPlaylistManager.visible) {
			if (p.playlistManager.woffset == 0 && properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
				p.scrollbar.check("lbtn_down", x, y);
			}

			// check scrollbar scroll on click above or below the cursor
			if (p.scrollbar.hover && !p.scrollbar.cursorDrag) {
				var scrollstep = p.list.totalRowVisible;
				if (y < p.scrollbar.cursorPos) {
					if (!p.list.buttonclicked && !cScrollBar.timeout) {
						p.list.buttonclicked = true;
						p.list.scrollItems(1, scrollstep);
						cScrollBar.timeout = window.SetTimeout(function () {
							cScrollBar.timeout = false;
							p.list.scrollItems(1, scrollstep);
							if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
							cScrollBar.interval = window.SetInterval(function () {
								if (p.scrollbar.hover) {
									if (mouse_x > p.scrollbar.x && p.scrollbar.cursorPos > mouse_y) {
										p.list.scrollItems(1, scrollstep);
									}
								}
							}, 60);
						}, 400);
					}
				} else {
					if (!p.list.buttonclicked && !cScrollBar.timeout) {
						p.list.buttonclicked = true;
						p.list.scrollItems(-1, scrollstep);
						cScrollBar.timeout = window.SetTimeout(function () {
							cScrollBar.timeout = false;
							p.list.scrollItems(-1, scrollstep);
							if (cScrollBar.interval) window.ClearInterval(cScrollBar.interval);
							cScrollBar.interval = window.SetInterval(function () {
								if (p.scrollbar.hover) {
									if (mouse_x > p.scrollbar.x && p.scrollbar.cursorPos + p.scrollbar.cursorHeight < mouse_y) {
										p.list.scrollItems(-1, scrollstep);
									}
								}
							}, 60);
						}, 400)
					}
				}
			}
		} else {
			p.playlistManager.check("lbtn_down", x, y);
		}

		// check topbar
		if (cTopBar.visible)
			p.topBar.buttonCheck("lbtn_down", x, y);
		// check headerbar
		if (p.headerBar.visible)
			p.headerBar.on_mouse("lbtn_down", x, y);
	}
}

function on_mouse_lbtn_up(x, y) {
	if (cSettings.visible) {
		p.settings.on_mouse("lbtn_up", x, y);
	} else {
		// scrollbar scrolls up and down RESET
		p.list.buttonclicked = false;
		if (cScrollBar.timeout) {
			window.ClearTimeout(cScrollBar.timeout);
			cScrollBar.timeout = false;
		}
		if (cScrollBar.interval) {
			window.ClearInterval(cScrollBar.interval);
			cScrollBar.interval = false;
		}

		// check list
		p.list.check("lbtn_up", x, y);

		// playlist manager (if visible)
		if (p.playlistManager.woffset > 0 || cPlaylistManager.visible) {
			p.playlistManager.check("lbtn_up", x, y);
		}

		// check scrollbar
		if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
			p.scrollbar.check("lbtn_up", x, y);
		}

		// check topbar
		if (cTopBar.visible)
			p.topBar.buttonCheck("lbtn_up", x, y);

		// check headerbar
		if (p.headerBar.visible)
			p.headerBar.on_mouse("lbtn_up", x, y);

		// repaint on mouse up to refresh covers just loaded
		full_repaint();
	}
}

function on_mouse_mbtn_down(x, y, mask) {
	g_middle_clicked = true;
	togglePlaylistManager();
}

function on_mouse_mbtn_up(x, y, mask) {
	if (g_middle_click_timeout) window.ClearTimeout(g_middle_click_timeout);
	g_middle_click_timeout = window.SetTimeout(function () {
		g_middle_click_timeout = false;
		g_middle_clicked = false;
	}, 250);
}

function on_mouse_move(x, y) {
	if (x == mouse_x && y == mouse_y)
		return;

	// check settings
	if (cSettings.visible) {
		p.settings.on_mouse("move", x, y);
	} else {
		// playlist manager (if visible)
		if (p.playlistManager.woffset > 0) {
			if (!cPlaylistManager.blink_interval) {
				p.playlistManager.check("move", x, y);
			}
		}

		// check list
		p.list.check("move", x, y);

		// check scrollbar
		if (!cPlaylistManager.visible) {
			if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
				p.scrollbar.check("move", x, y);
			}
		}

		// check headerbar
		if (p.headerBar.visible)
			p.headerBar.on_mouse("move", x, y);

		// check toolbar for mouse icon dragging mode ***
		if (cPlaylistManager.drag_moved) {
			if (p.playlistManager.ishoverItem) {
				window.SetCursor(IDC_HELP);
			} else {
				window.SetCursor(IDC_NO);
			}
		}
	}

	// save coords
	mouse_x = x;
	mouse_y = y;
}

function on_mouse_rbtn_up(x, y) {
	if (cSettings.visible) {
		p.settings.on_mouse("rbtn_up", x, y);
	} else {
		if (x >= ww - p.scrollbar.w) return false;

		if (p.headerBar.visible)
			p.headerBar.on_mouse("rbtn_up", x, y);

		p.playlistManager.check("rbtn_up", x, y);
		p.list.check("rbtn_up", x, y);
	}
	return true;
}

function on_mouse_wheel(delta) {
	if (g_middle_clicked)
		return;

	if (cSettings.visible) {
		p.settings.on_mouse("wheel", mouse_x, mouse_y, delta);
		if (cSettings.wheel_timeout) window.ClearTimeout(cSettings.wheel_timeout);
		cSettings.wheel_timeout = window.SetTimeout(function () {
			cSettings.wheel_timeout = false;
			on_mouse_move(mouse_x + 1, mouse_y + 1);
		}, 50);
	}

	if (p.list.ishover || cScrollBar.timeout) {
		if (!g_mouse_wheel_timeout) {
			g_mouse_wheel_timeout = window.SetTimeout(function () {
				g_mouse_wheel_timeout = false;
				p.list.scrollItems(delta, cList.scrollstep);
			}, 20);
		}
	} else {
		p.playlistManager.check("wheel", mouse_x, mouse_y, delta);
	}
}

function on_paint(gr) {
	if (cSettings.visible) {
		p.settings && p.settings.draw(gr);
	} else {
		gr.Clear(g_colour_background);
		if (fb.IsPlaying && properties.showwallpaper && images.wallpaper) {
			DrawWallpaper(gr);
		}

		// List
		if (p.list) {
			if (p.list.count > 0) {
				// calculate columns metrics before drawing row contents!
				p.headerBar.calculateColumns();

				// scrollbar
				if (properties.showscrollbar && p.scrollbar && p.list.totalRows > 0 && (p.list.totalRows > p.list.totalRowVisible)) {
					p.scrollbar.visible = true;
					p.scrollbar.draw(gr);
				} else {
					p.scrollbar.visible = false;
				}

				// draw rows of the playlist
				p.list.draw(gr);
			} else {
				if (plman.PlaylistCount > 0) {
					var text_top = plman.GetPlaylistName(g_active_playlist);
					var text_bot = "This playlist is empty";
				} else {
					var text_top = "JSPlaylist coded by Br3tt";
					var text_bot = "Create a playlist to start!";
				}
				var y = Math.floor(wh / 2);
				gr.WriteText(text_top, g_font_19_1, g_colour_text, 0, y - g_z5 - height(g_font_19_1), ww, height(g_font_19_1), 2, 1, 1);
				gr.FillRectangle(40, Math.floor(wh / 2), ww - 80, 1, g_colour_text & 0x40ffffff);
				gr.WriteText(text_bot, g_font_12_1, blendColours(g_colour_text, g_colour_background, 0.35), 0, y + g_z5, ww, height(g_font_12_1), 2, 0, 1);
			}
		}

		// draw background part above playlist (topbar + headerbar)
		if (cTopBar.visible || p.headerBar.visible) {
			gr.FillRectangle(0, 0, ww, p.list.y, g_colour_background);
		}

		// TopBar
		if (cTopBar.visible) {
			p.topBar && p.topBar.draw(gr);
		}

		// HeaderBar
		if (p.headerBar.visible) {
			p.headerBar && p.headerBar.drawColumns(gr);
			if (p.headerBar.borderDragged && p.headerBar.borderDraggedId >= 0) {
				// all borders
				for (var b = 0; b < p.headerBar.borders.length; b++) {
					var lg_x = p.headerBar.borders[b].x - 2;
					var lg_w = p.headerBar.borders[b].w;
					var segment_h = 5;
					var gap_h = 5;
					if (b == p.headerBar.borderDraggedId) {
						var d = ((mouse_x / 10) - Math.floor(mouse_x / 10)) * 10; // give a value between [0;9]
					} else {
						d = 5;
					}
					var ty = 0;
					for (var lg_y = p.list.y; lg_y < p.list.y + p.list.h + segment_h; lg_y += segment_h + gap_h) {
						ty = lg_y - segment_h + d;
						th = segment_h;
						if (ty < p.list.y) {
							th = th - Math.abs(p.list.y - ty);
							ty = p.list.y;
						}
						if (b == p.headerBar.borderDraggedId) {
							gr.FillRectangle(lg_x, ty, lg_w, th, g_colour_text & 0x32ffffff);
						} else {
							gr.FillRectangle(lg_x, ty, lg_w, th, g_colour_text & 0x16ffffff);
						}
					}
				}
			}
		} else {
			p.headerBar && p.headerBar.drawHiddenPanel(gr);
		}

		// PlaylistManager
		p.playlistManager && p.playlistManager.draw(gr);
	}
}

function on_playback_dynamic_info_track(type) {
	if (type == 1) {
		images.wallpaper = get_wallpaper();

		if (properties.enableDynamicColours) {
			on_colours_changed();
		}

		full_repaint();
	}
}

function on_playback_new_track() {
	images.wallpaper = get_wallpaper();

	if (properties.enableDynamicColours) {
		on_colours_changed();
	}

	full_repaint();
}

function on_playback_pause(state) {
	if (p.list.nowplaying_y + cRow.playlist_h > p.list.y && p.list.nowplaying_y < p.list.y + p.list.h) {
		window.RepaintRect(p.list.x, p.list.nowplaying_y, p.list.w, cRow.playlist_h);
	}
}

function on_playback_queue_changed() {
	full_repaint();
}

function on_playback_stop(reason) {
	if (reason != 2) {
		if (images.wallpaper) images.wallpaper.Dispose();
		images.wallpaper = null

		if (properties.enableDynamicColours) {
			on_colours_changed();
		}

		full_repaint();
	}
}

function on_playback_time(time) {
	g_seconds = time;
	if (!cSettings.visible && p.list.nowplaying_y + cRow.playlist_h > p.list.y && p.list.nowplaying_y < p.list.y + p.list.h)
		window.RepaintRect(p.list.x, p.list.nowplaying_y, p.list.w, cRow.playlist_h);
}

function on_playlist_item_ensure_visible(playlist, index) {
	on_item_focus_change(playlist, 0, index);
}

function on_playlist_items_added(playlist_idx) {
	if (playlist_idx == g_active_playlist) {
		update_playlist();
		p.topBar.setDatas();
		p.headerBar.resetSortIndicators();
		full_repaint();
	}
}

function on_playlist_items_removed(playlist_idx, new_count) {
	if (playlist_idx == g_active_playlist) {
		update_playlist();
		p.topBar.setDatas();
		p.headerBar.resetSortIndicators();
		full_repaint();
	}
}

function on_playlist_items_reordered(playlist_idx) {
	if (playlist_idx == g_active_playlist && p.headerBar.columnDragged == 0) {
		update_playlist();
		p.headerBar.resetSortIndicators();
		full_repaint();
	} else {
		p.headerBar.columnDragged = 0;
	}
}

function on_playlist_items_selection_change() {
	full_repaint();
}

function on_playlist_switch() {
	g_active_playlist = plman.ActivePlaylist
	update_playlist();
	p.topBar.setDatas();
	p.headerBar.resetSortIndicators();
	full_repaint();
}

function on_playlists_changed() {
	g_active_playlist = plman.ActivePlaylist;

	p.topBar.setDatas();
	if (cPlaylistManager.visible && cPlaylistManager.drag_dropped) {
		window.SetCursor(IDC_ARROW);
	}
	p.playlistManager.refresh();
	full_repaint();
}

function on_size() {
	ww = window.Width;
	wh = window.Height;
	resize_panels();

	if (!g_init_on_size) {
		update_playlist();
		g_init_on_size = true;
	}
}

function DrawCover(gr, img, dst_x, dst_y, dst_w, dst_h) {
	if (img) {
		var s = Math.min(dst_w / img.Width, dst_h / img.Height);
		var w = Math.floor(img.Width * s);
		var h = Math.floor(img.Height * s);
		dst_x += Math.round((dst_w - w) / 2);
		dst_w = w;
		dst_h = h;
		gr.DrawImage(img, dst_x, dst_y, dst_w, dst_h, 0, 0, img.Width, img.Height);
	}
	DrawRectangle(gr, dst_x, dst_y, dst_w - 1, dst_h - 1, g_colour_text);
}

function DrawWallpaper(gr) {
	if (images.wallpaper.Width / images.wallpaper.Height < ww / wh) {
		var src_x = 0;
		var src_w = images.wallpaper.Width;
		var src_h = Math.round(wh * images.wallpaper.Width / ww);
		var src_y = Math.round((images.wallpaper.Height - src_h) / 2);
	} else {
		var src_y = 0;
		var src_w = Math.round(ww * images.wallpaper.Height / wh);
		var src_h = images.wallpaper.Height;
		var src_x = Math.round((images.wallpaper.Width - src_w) / 2);
	}
	var opacity = 1 / 10 * (properties.wallpaperopacity - 3);
	gr.DrawImage(images.wallpaper, 0, p.list.y, ww, p.list.h, src_x, src_y, src_w, src_h, opacity);
}

function GetKeyboardMask() {
	if (utils.IsKeyPressed(VK_CONTROL))
		return KMask.ctrl;
	if (utils.IsKeyPressed(VK_SHIFT))
		return KMask.shift;
	return KMask.none;
}

function num(strg, nb) {
	var i;
	var str = strg.toString();
	var k = nb - str.length;
	if (k > 0) {
		for (i = 0; i < k; i++) {
			str = "0" + str;
		}
	}
	return str.toString();
}

function button(normal, hover, down) {
	this.img = [normal, hover, down];
	this.w = this.img[0].Width;
	this.h = this.img[0].Height;
	this.state = ButtonStates.normal;

	this.update = function (normal, hover, down) {
		this.img = [normal, hover, down];
		this.w = this.img[0].Width;
		this.h = this.img[0].Height;
	}

	this.draw = function (gr, x, y) {
		this.x = x;
		this.y = y;
		if (this.img[this.state]) gr.DrawImage(this.img[this.state], this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);
	}

	this.checkstate = function (event, x, y) {
		this.ishover = (x > this.x && x < this.x + this.w - 1 && y > this.y && y < this.y + this.h - 1);
		var old = this.state;
		switch (event) {
		case "lbtn_down":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = this.ishover ? ButtonStates.down : ButtonStates.normal;
				this.isdown = true;
				break;
			}
			break;
		case "lbtn_up":
			this.state = this.ishover ? ButtonStates.hover : ButtonStates.normal;
			this.isdown = false;
			break;
		case "move":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = this.ishover ? ButtonStates.hover : ButtonStates.normal;
				break;
			}
			break;
		}

		if (this.state != old) {
			window.RepaintRect(this.x, this.y, this.w, this.h);
		}
		return this.state;
	}
}

function get_tfo(pattern) {
	if (!tfos[pattern]) {
		tfos[pattern] = fb.TitleFormat(pattern);
	}
	return tfos[pattern];
}

function renamePlaylist() {
	if (!p.playlistManager.inputbox.text || p.playlistManager.inputbox.text == "" || p.playlistManager.inputboxID == -1)
		p.playlistManager.inputbox.text = p.playlistManager.playlists[p.playlistManager.inputboxID].name;
	if (p.playlistManager.inputbox.text.length > 1 || (p.playlistManager.inputbox.text.length == 1 && (p.playlistManager.inputbox.text >= "a" && p.playlistManager.inputbox.text <= "z") || (p.playlistManager.inputbox.text >= "A" && p.playlistManager.inputbox.text <= "Z") || (p.playlistManager.inputbox.text >= "0" && p.playlistManager.inputbox.text <= "9"))) {
		p.playlistManager.playlists[p.playlistManager.inputboxID].name = p.playlistManager.inputbox.text;
		plman.RenamePlaylist(p.playlistManager.playlists[p.playlistManager.inputboxID].idx, p.playlistManager.inputbox.text);
		full_repaint();
	}
	p.playlistManager.inputboxID = -1;
}

function inputboxPlaylistManager_activate() {
	if (cPlaylistManager.inputbox_timeout) {
		window.ClearTimeout(cPlaylistManager.inputbox_timeout);
		cPlaylistManager.inputbox_timeout = false;
	}

	p.playlistManager.inputbox.on_focus(true);
	p.playlistManager.inputbox.edit = true;
	p.playlistManager.inputbox.Cpos = p.playlistManager.inputbox.text.length;
	p.playlistManager.inputbox.anchor = p.playlistManager.inputbox.Cpos;
	p.playlistManager.inputbox.SelBegin = p.playlistManager.inputbox.Cpos;
	p.playlistManager.inputbox.SelEnd = p.playlistManager.inputbox.Cpos;
	if (!cInputbox.cursor_interval) {
		p.playlistManager.inputbox.resetCursorTimer();
	}
	p.playlistManager.inputbox.dblclk = true;
	p.playlistManager.inputbox.SelBegin = 0;
	p.playlistManager.inputbox.SelEnd = p.playlistManager.inputbox.text.length;
	p.playlistManager.inputbox.text_selected = p.playlistManager.inputbox.text;
	p.playlistManager.inputbox.select = true;
	full_repaint();
}

function togglePlaylistManager() {
	if (!cPlaylistManager.hscroll_interval) {
		if (cPlaylistManager.visible) {
			cPlaylistManager.hscroll_interval = window.SetInterval(function () {
				p.playlistManager.repaint();
				p.playlistManager.woffset -= cPlaylistManager.step;
				if (p.playlistManager.woffset <= 0) {
					p.playlistManager.woffset = 0;
					cPlaylistManager.visible = false;
					p.headerBar.button.update(p.headerBar.slide_open, p.headerBar.slide_open, p.headerBar.slide_open);
					full_repaint();
					window.ClearInterval(cPlaylistManager.hscroll_interval);
					cPlaylistManager.hscroll_interval = false;
				}
			}, 16);
		} else {
			p.playlistManager.refresh();
			cPlaylistManager.hscroll_interval = window.SetInterval(function () {
				p.playlistManager.woffset += cPlaylistManager.step;
				if (p.playlistManager.woffset >= cPlaylistManager.width) {
					p.playlistManager.woffset = cPlaylistManager.width;
					cPlaylistManager.visible = true;
					p.headerBar.button.update(p.headerBar.slide_close, p.headerBar.slide_close, p.headerBar.slide_close);
					full_repaint();
					window.ClearInterval(cPlaylistManager.hscroll_interval);
					cPlaylistManager.hscroll_interval = false;
				} else {
					p.playlistManager.repaint();
				}
			}, 16);
		}
	}
}

function image_cache() {
	this.get = function (metadb, group_key) {
		var img = this.cachelist[group_key];
		if (img) return img;

		if (!this.requested[group_key]) {
			this.requested[group_key] = true;
			window.SetTimeout(function () {
				metadb.GetAlbumArtAsync(window.ID, cGroup.art_id);
			}, 20);
		}
		return null;
	}

	this.set = function (metadb, image, group_key) {
		var max = 250;
		if (image) {
			if (image.Width > max || image.Height > max) {
				var s = Math.min(max / image.Width, max / image.Height);
				var w = Math.floor(image.Width * s);
				var h = Math.floor(image.Height * s);
				image.Resize(w, h);
			}
		} else {
			image = images.nocover;
		}
		this.cachelist[group_key] = image;
		full_repaint();
	}

	this.reset = function () {
		for (var key in this.cachelist) {
			this.cachelist[key].Dispose();
		}
		this.cachelist = {};
		this.requested = {};
	}

	this.cachelist = {};
	this.requested = {};
}

function full_repaint() {
	need_repaint = true;
}

function resize_panels() {
	cRow.playlist_h = scale(cRow.default_playlist_h);
	if (cList.enableExtraLine) {
		cRow.playlist_h += scale(6);
	}

	p.topBar.setSize(0, 0, ww, cTopBar.visible ? cTopBar.height + cHeaderBar.borderWidth : 0);

	p.headerBar.visible = cHeaderBar.locked;
	p.headerBar.setSize(0, p.topBar.h, ww, cHeaderBar.height);
	p.headerBar.calculateColumns();

	// set Size of List
	var list_h = wh - p.topBar.h - (p.headerBar.visible ? p.headerBar.h + cHeaderBar.borderWidth : 0);
	p.list.setSize(0, wh - list_h, ww, list_h);
	if (g_init_on_size) {
		p.list.setItems(true);
	}

	// set Size of scrollbar
	p.scrollbar.setSize(p.list.x + p.list.w - cScrollBar.width, p.list.y, cScrollBar.width, p.list.h);
	p.scrollbar.setCursor(p.list.totalRowVisible, p.list.totalRows, p.list.offset);

	// set Size of Settings
	p.settings.setSize(0, 0, ww, wh);

	// set Size of PlaylistManager
	if (cPlaylistManager.visible) {
		cPlaylistManager.visible = g_init_on_size;
		p.playlistManager.woffset = g_init_on_size ? 0 : cPlaylistManager.width;
	}
	p.playlistManager.setSize(ww, p.list.y, cPlaylistManager.width, p.list.h);
	p.playlistManager.refresh();
}

function init() {
	get_font();
	get_colours();
	plman.SetActivePlaylistContext();
	images.wallpaper = get_wallpaper();

	p.list = new oList("p.list");
	p.topBar = new oTopBar();
	p.headerBar = new oHeaderBar();
	p.scrollbar = new PlaylistScrollBar();

	p.playlistManager = new oPlaylistManager();
	p.settings = new oSettings();

	window.SetInterval(function () {
		if (!window.IsVisible) {
			need_repaint = true;
			return;
		}

		if (need_repaint) {
			need_repaint = false;
			window.Repaint();
		}
	}, 40);
}

function update_playlist() {
	g_group_id_focused = 0;
	p.list.updateHandleList();

	p.list.setItems(false);
	p.scrollbar.setCursor(p.list.totalRowVisible, p.list.totalRows, p.list.offset);
	if (cHeaderBar.sortRequested) {
		window.SetCursor(IDC_ARROW);
		cHeaderBar.sortRequested = false;
	}
}

function height(font) {
	return JSON.parse(font).Size + scale(4);
}

function scale(size) {
	return Math.round(size * g_font_size / 12);
}

function _font(name, size, bold) {
	var font = {
		Name : name,
		Size : scale(size),
		Weight : bold == 1 ? 700 : 400,
	};
	return JSON.stringify(font);
}

function get_font() {
	var default_font;

	if (window.IsDefaultUI) {
		default_font = JSON.parse(window.GetFontDUI(FontTypeDUI.playlists));
	} else {
		default_font = JSON.parse(window.GetFontCUI(FontTypeCUI.items));
	}

	var name = default_font.Name;
	g_font_size = default_font.Size;

	cTopBar.height = scale(54);
	cHeaderBar.height = scale(26);
	cHeaderBar.borderWidth = scale(2);
	cSettings.topBarHeight = scale(50);
	cSettings.tabPaddingWidth = scale(16);
	cSettings.rowHeight = scale(30);
	cPlaylistManager.width = scale(220);
	cPlaylistManager.rowHeight = scale(28);
	cPlaylistManager.statusBarHeight = scale(18);
	cScrollBar.width = scale(cScrollBar.defaultWidth);

	g_z2 = scale(2);
	g_z4 = scale(4);
	g_z5 = scale(5);
	g_z10 = scale(10);
	g_z16 = scale(16);

	g_font_12 = _font(name, 12);
	g_font_12_1 = _font(name, 12, 1);

	g_font_15_1 = _font(name, 15, 1);
	g_font_19_1 = _font(name, 19, 1);
	g_font_21_1 = _font(name, 21, 1);

	g_font_awesome_12 = _font("FontAwesome", 12);
	g_font_awesome_20 = _font("FontAwesome", 20);
	g_font_awesome_40 = _font("FontAwesome", 40);

	g_font_group1 = _font(name, 16);
	g_font_group2 = _font(name, 14);

	columns.rating_w = (chars.rating_off.calc_width(g_font_awesome_20) * 5) + 4;
}

function get_colours() {
	g_dynamic = false;
	g_colour_mood = window.GetProperty("JSPLAYLIST.COLOUR.MOOD", RGB(196,30,35));

	if (properties.enableDynamicColours) {
		var arr = GetNowPlayingColours();
		if (arr.length) {
			g_dynamic = true;
			g_colour_background = arr[0];
			g_colour_text = arr[1];
			g_colour_selection = arr[2];
			g_colour_selected_text = arr[3];
			g_colour_highlight = g_colour_text;
			g_themed = false;
			return;
		}
	}

	if (properties.enableCustomColours) {
		g_colour_background = window.GetProperty("JSPLAYLIST.COLOUR BACKGROUND NORMAL", RGB(25, 25, 35));
		g_colour_selection = window.GetProperty("JSPLAYLIST.COLOUR BACKGROUND SELECTED", RGB(130,150,255));
		g_colour_text = window.GetProperty("JSPLAYLIST.COLOUR TEXT NORMAL", RGB(180, 180, 180));
		g_colour_selected_text = DetermineTextColour(g_colour_selection);
		g_colour_highlight = g_colour_text;
		g_themed = false;
	} else {
		if (window.IsDefaultUI) {
			g_colour_background = window.GetColourDUI(ColourTypeDUI.background);
			g_colour_selection = window.GetColourDUI(ColourTypeDUI.selection);
			g_colour_text = window.GetColourDUI(ColourTypeDUI.text);
			g_colour_selected_text = DetermineTextColour(g_colour_selection);
			g_colour_highlight = window.GetColourDUI(ColourTypeDUI.highlight);
		} else {
			g_colour_background = window.GetColourCUI(ColourTypeCUI.background);
			g_colour_selection = window.GetColourCUI(ColourTypeCUI.selection_background);
			g_colour_text = window.GetColourCUI(ColourTypeCUI.text);
			g_colour_selected_text = window.GetColourCUI(ColourTypeCUI.selection_text);
			g_colour_highlight = g_colour_text;
		}

		// check g_theme to make sure window.CreateThemeManager didn't return null
		// window.IsThemed is a new boolean property for 3.2.11 and later, undefined for previous versions
		g_themed = g_theme && window.IsThemed;
		if (g_themed) {
			g_theme.SetPartAndStateID(6, 12);
			g_colour_selected_text = utils.GetSysColour(COLOR_WINDOWTEXT);
		}
	}
}

function get_wallpaper() {
	var img = null;
	if (!properties.showwallpaper) return img;

	var metadb = fb.GetNowPlaying();
	if (!metadb) return img;

	if (properties.wallpapertype == -1) {
		if (utils.IsFile(properties.wallpaperpath)) {
			img = utils.LoadImage(properties.wallpaperpath);
		} else {
			img = utils.LoadImage(fb.ProfilePath + properties.wallpaperpath);
		}
	} else {
		img = metadb.GetAlbumArt(properties.wallpapertype);
	}

	if (img && properties.wallpaperblurred) {
		img.StackBlur(properties.wallpaperblurvalue);
	}
	return img;
}

String.prototype.calc_width = function (font_str) {
	var font = JSON.parse(font_str);
	return utils.CalcTextWidth(this, font.Name, font.Size, font.Weight || 400);
}

Number.prototype.calc_width = function (font_str) {
	var font = JSON.parse(font_str);
	return utils.CalcTextWidth(this.toString(), font.Name, font.Size, font.Weight || 400);
}

String.prototype.repeat = function (num) {
	if (num >= 0 && num <= 5) {
		var g = Math.round(num);
	} else {
		return "";
	}
	return new Array(g + 1).join(this);
}

var g_middle_clicked = false;
var g_middle_click_timeout = false;
var g_textbox_tabbed = false;
var g_init_on_size = false;
var g_seconds = 0;
var g_mouse_wheel_timeout = false;
var g_active_playlist = plman.ActivePlaylist;
var g_image_cache = new image_cache();
var g_selHolder = fb.AcquireSelectionHolder();
g_selHolder.SetPlaylistSelectionTracking();

var g_drag_drop_status = false;
var g_drag_drop_bottom = false;
var g_drag_drop_track_id = -1;
var g_drag_drop_row_id = -1;
var g_drag_drop_playlist_id = -1;
var g_drag_drop_playlist_manager_hover = false;
var g_drag_drop_internal = false;

var g_colour_text = 0;
var g_colour_selected_text = 0;
var g_colour_background = 0;
var g_colour_selection = 0;
var g_colour_highlight = 0;
var g_colour_mood = 0;
var g_colour_rating = RGB(255, 128, 0);
var g_font_size = 0;
var g_dynamic = false;

var g_themed = false;
var g_theme = window.CreateThemeManager("LISTVIEW");
var COLOR_WINDOWTEXT = 8;

var g_tf_pattern = "";
var g_tf2_pattern = "";

var ww = 0, wh = 0;
var mouse_x = 0, mouse_y = 0;
var need_repaint = false;
var foo_playcount = fb.CheckComponent("foo_playcount");
var foo_lastfm_playcount_sync = fb.CheckComponent("foo_lastfm_playcount_sync");
var tfos = {};
var tf_group_key = null;

var KMask = {
	none: 0,
	ctrl: 1,
	shift: 2
};

var ButtonStates = {
	normal: 0,
	hover: 1,
	down: 2
};

var properties = {
	enableDynamicColours: window.GetProperty("JSPLAYLIST.Enable Dynamic Colours", false),
	enableCustomColours: window.GetProperty("JSPLAYLIST.Enable Custom Colours", false),
	showgroupheaders : window.GetProperty("JSPLAYLIST.Show Group Headers", true),
	showscrollbar : window.GetProperty("JSPLAYLIST.Show Scrollbar", true),
	showwallpaper : window.GetProperty("JSPLAYLIST.Show Wallpaper", false),
	wallpaperopacity : window.GetProperty("JSPLAYLIST.Wallpaper Opacity", 5), // 5-20% 6-30% 7-40% 8-50% 9-60%
	wallpaperblurred : window.GetProperty("JSPLAYLIST.Wallpaper Blurred", false),
	wallpaperblurvalue : window.GetProperty("JSPLAYLIST.Wallpaper StackBlur value", 60),
	wallpapertype : window.GetProperty("JSPLAYLIST.Wallpaper Type", 0),
	wallpaperpath : window.GetProperty("JSPLAYLIST.Default Wallpaper Path", ""),
	max_columns : 24,
	max_patterns : 25,
	use_foo_lastfm_playcount_sync : window.GetProperty("Love tracks with foo_lastfm_playcount_sync", false),
};

var images = {
	wallpaper : null,
};

var cRow = {
	default_playlist_h : window.GetProperty("JSPLAYLIST.Playlist Row Height in Pixel", 28),
	playlist_h : 29,
};

var p = {
	topbar : null,
	headerBar : null,
	list : null,
	playlistManager : null,
	settings : null,
	on_key_timeout : false
};

var cSettings = {
	visible : false,
	topBarHeight : 50,
	tabPaddingWidth : 16,
	rowHeight : 30,
	wheel_timeout : false
};

var cPlaylistManager = {
	width : 220,
	rowHeight : 28,
	showStatusBar : true,
	statusBarHeight : 18,
	step : 50,
	visible : false,
	hscroll_interval : false,
	drag_clicked : false,
	drag_moved : false,
	drag_target_id : -1,
	drag_source_id : -1,
	drag_dropped : false,
	rightClickedId : null,
	init_timeout : false,
	inputbox_timeout : false,
};

var cTopBar = {
	height : 54,
	visible : window.GetProperty("JSPLAYLIST.TopBar.Visible", true)
};

var cHeaderBar = {
	height : 26,
	borderWidth : 2,
	locked : window.GetProperty("JSPLAYLIST.HEADERBAR2.Locked", true),
	timerAutoHide : false,
	sortRequested : false
};

var cScrollBar = {
	defaultWidth : 17,
	width : 17,
	buttonType : {
		cursor : 0,
		up : 1,
		down : 2
	},
	interval : false,
	timeout : false,
	timer_counter : 0,
	repaint_timeout : false,
};

var cGroup = {
	expandedHeight : 3,
	pattern_idx : window.GetProperty("JSPLAYLIST.GROUPBY2.INDEX", 0),
	art_id : window.GetProperty("JSPLAYLIST.GROUPBY2.ART.ID", 0),
};

var cover = { show : true };

var cList = {
	scrollstep : window.GetProperty("JSPLAYLIST.Playlist Scroll Step", 3),
	scroll_timer : false,
	scroll_delta : cRow.playlist_h,
	scroll_direction : 1,
	scroll_step : Math.floor(cRow.playlist_h / 3),
	scroll_div : 2,
	borderWidth : 2,
	enableExtraLine : window.GetProperty("JSPLAYLIST.Enable Extra Line", true)
};

var columns = {
	mood_x : 0,
	mood_w : 0,
	rating_x : 0,
	rating_w : 0,
};

init();
