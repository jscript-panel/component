function on_char(code) {
	if (ppt.showHeaderBar && brw.inputbox.edit) {
		brw.inputbox.on_char(code);
	}
}

function on_focus(is_focused) {
	if (!is_focused) {
		brw.repaint();
	}
}

function on_key_down(vkey) {
	if (ppt.showHeaderBar) {
		brw.inputbox.on_key_down(vkey);
	}

	if (GetKeyboardMask() == KMask.ctrl) {
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

function on_key_up(vkey) {
	cScrollBar.timerCounter = -1;
	if (cScrollBar.timerID) {
		window.ClearTimeout(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}
	brw.repaint();
}

function on_library_items_added() {
	brw.populate();
}

function on_library_items_changed(handles, fromhook) {
	if (!fromhook) {
		brw.populate();
	}
}

function on_library_items_removed() {
	brw.populate();
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	brw.on_mouse("lbtn_dblclk", x, y);
}

function on_mouse_lbtn_down(x, y) {
	if (x < brw.w) g_drag_drop = true;

	brw.on_mouse("lbtn_down", x, y);
}

function on_mouse_lbtn_up(x, y) {
	g_drag_drop = false;
	brw.on_mouse("lbtn_up", x, y);
}

function on_mouse_move(x, y) {
	if (m_x == x && m_y == y)
		return;

	brw.on_mouse("move", x, y);

	m_x = x;
	m_y = y;
}

function on_mouse_rbtn_down(x, y) {
	brw.on_mouse("rbtn_down", x, y);
}

function on_mouse_rbtn_up(x, y) {
	brw.on_mouse("rbtn_up", x, y);
	return true;
}

function on_mouse_wheel(step) {
	if (utils.IsKeyPressed(VK_CONTROL)) {
		update_extra_font_size(step);
	} else {
		scroll -= step * brw.rowHeight * ppt.rowScrollStep;
		scroll = check_scroll(scroll)
		brw.on_mouse("wheel", m_x, m_y, step);
	}
}

function on_paint(gr) {
	if (ww < 10 || wh < 10)
		return;

	gr.Clear(g_colour_background);
	brw.draw(gr);

	if (ppt.showHeaderBar) {
		var size = ppt.headerBarHeight;

		if (brw.inputbox.text.length > 0) {
			brw.reset_bt.draw(gr, 0, 0);
		} else {
			gr.WriteText(chars.search, g_font_awesome, g_colour_text, 0, -2, size, size, 2, 2);
		}

		brw.inputbox.draw(gr, size + 4, 2);
		gr.FillRectangle(scale(22) + brw.inputbox.w, 4, 1, size - 3, g_colour_text & 0x22ffffff);
	}
}

function on_playback_dynamic_info_track(type) {
	if (type == 1 && ppt.enableDynamicColours) {
		on_colours_changed();
		brw.repaint();
	}
}

function on_playback_new_track() {
	if (ppt.enableDynamicColours) {
		on_colours_changed();
		brw.repaint();
	}
}

function on_playback_stop(reason) {
	if (reason != 2 && ppt.enableDynamicColours) {
		on_colours_changed();
		brw.repaint();
	}
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

		switch (ppt.panelMode) {
		case 0:
		case 1:
			ppt.lineHeightMin = scale(ppt.default_lineHeightMin);
			this.totalColumns = 1;
			this.rowsCount = this.groups.length;
			this.thumbnailWidth = this.w;
			switch (ppt.tagMode) {
			case 0: // album
				this.rowHeight = (ppt.panelMode == 0 ? Math.ceil(g_fsize * 5.5) : ppt.lineHeightMin);
				break;
			case 1: // artist
			case 2: // album artist
				this.rowHeight = (ppt.panelMode == 0 ? Math.ceil(g_fsize * 2.5) : ppt.lineHeightMin);
				break;
			}
			break;
		case 2:
		case 3:
			ppt.thumbnailWidthMin = scale(ppt.default_thumbnailWidthMin);
			this.totalColumns = Math.floor(this.w / ppt.thumbnailWidthMin);
			if (this.totalColumns < 1) this.totalColumns = 1;
			this.thumbnailWidth = this.w / this.totalColumns;
			this.rowsCount = Math.ceil(this.groups.length / this.totalColumns);
			this.rowHeight = this.thumbnailWidth;
			if (ppt.panelMode == 2) this.rowHeight += g_font_height * 4;
			break;
		}

		this.totalRows = Math.ceil(this.h / this.rowHeight);
		this.totalRowsVis = Math.floor(this.h / this.rowHeight);

		this.inputbox.setSize(ww * 0.6, scale(20));
		this.scrollbar.setSize();
		this.reset_bt = new button(images.reset, images.reset_hover, images.reset_hover);

		scroll = Math.round(scroll / this.rowHeight) * this.rowHeight;
		scroll = check_scroll(scroll);
		scroll_ = scroll;

		this.scrollbar.updateScrollbar();
	}

	this.populate = function () {
		this.groups = [];
		this.list = fb.GetLibraryItems(g_filter_text);

		if (this.list.Count > 0) {
			var track_tfs = [];
			if (ppt.tagMode == 0) { //album
				this.list.SortByFormat(ppt.sort_album_tf, 1);
				track_tfs = tfo.groupkey_album.EvalWithMetadbs(this.list).toArray();
			} else if (ppt.tagMode == 1) { // artist
				this.list.SortByFormat(ppt.sort_artist_tf, 1);
				track_tfs = tfo.groupkey_artist.EvalWithMetadbs(this.list).toArray();
			} else if (ppt.tagMode == 2) { // album artist
				this.list.SortByFormat(ppt.sort_album_artist_tf, 1);
				track_tfs = tfo.groupkey_album_artist.EvalWithMetadbs(this.list).toArray();
			}

			var previous = "";
			var g = 0;
			var handles = fb.CreateHandleList();

			track_tfs.forEach((function (track_tf, i) {
				var handle = this.list.GetItem(i);
				var pos = track_tf.lastIndexOf(" ^^ ");
				var cachekey = track_tf.substr(pos + 4);
				var meta = track_tf.substr(0, pos);
				var current = meta.toLowerCase();

				if (current != previous) {
					previous = current;
					if (g > 0) {
						this.groups[g - 1].finalise(handles);
						handles.RemoveAll();
					}
					g++;
					this.groups.push(new oGroup(g, i, handle, meta, cachekey));
				}
				handles.AddItem(handle);
			}).bind(this));

			if (g > 0) {
				this.groups[g - 1].finalise(handles);

				if (g > 1 && ppt.showAllItem) {
					var meta = "All items";
					if (ppt.tagMode == 0) {
						var all_items = "(" + this.groups.length + " " + ppt.tagText[ppt.tagMode] + "s)"
						meta += " ^^ " + all_items;
					}
					this.groups.unshift(new oGroup(0, 0, null, meta, 0));
					this.groups[0].finalise(this.list);
				}
			}
			handles.Dispose();
		}

		get_metrics();
		this.repaint();
	}

	this.activateItem = function (index) {
		if (this.groups.length == 0)
			return;
		this.selectedIndex = index;
	}

	this.sendItemsToPlaylist = function (index) {
		if (this.groups.length == 0)
			return;

		var p = plman.FindOrCreatePlaylist(ppt.sendto_playlist, true);
		plman.UndoBackup(p);
		plman.ClearPlaylist(p);
		plman.InsertPlaylistItems(p, 0, this.groups[index].handles)
		plman.ActivePlaylist = p;
		if (ppt.sendto_playlist_play) {
			plman.ExecutePlaylistDefaultAction(p, 0);
		}
	}

	this.getlimits = function () {
		if (this.groups.length <= this.totalRowsVis * this.totalColumns) {
			var start_ = 0;
			var end_ = this.groups.length;
		} else {
			var start_ = Math.round(scroll_ / this.rowHeight) * this.totalColumns;
			var end_ = Math.round((scroll_ + wh + this.rowHeight) / this.rowHeight) * this.totalColumns;
			end_ = (this.groups.length < end_) ? this.groups.length : end_;
			start_ = start_ > 0 ? start_ - this.totalColumns : (start_ < 0 ? 0 : start_);
		}
		g_start_ = start_;
		g_end_ = end_;
	}

	this.draw = function (gr) {
		this.getlimits();

		var cx = 0;
		var ax = 0;
		var ay = 0;
		var aw = this.thumbnailWidth;
		var ah = this.rowHeight;

		for (var i = g_start_; i < g_end_; i++) {
			var group = this.groups[i];

			var row = Math.floor(i / this.totalColumns);
			ax = this.x + (cx * this.thumbnailWidth);
			ay = Math.floor(this.y + (row * this.rowHeight) - scroll_);
			group.x = ax;
			group.y = ay;

			var normal_text = g_colour_text;
			var fader_txt = setAlpha(normal_text, 180);

			if (ppt.panelMode != 0 && !group.cover_image && !group.image_requested && group.metadb) {
				group.image_requested = true;
				var id = ppt.tagMode == 0 ? AlbumArtId.front : AlbumArtId.artist;
				group.cover_image = get_art(group.metadb, group.cachekey, id);
			}

			var fh = g_font_height + 6;
			var str = group.date.length ? group.date + "\r\n" + group.artist : group.artist;

			switch (ppt.panelMode) {
			case 0:
			case 1:
				if (i % 2 != 0) {
					gr.FillRectangle(ax, ay, aw, ah, setAlpha(g_colour_text, 8));
				}

				if (i == this.selectedIndex) {
					drawSelectedRectangle(gr, ax, ay, aw, ah);
					normal_text = g_colour_selected_text;
					fader_txt = setAlpha(normal_text, 180);
				}

				var text_left = 8;
				var text_width = aw - (text_left * 2);
				if (ppt.panelMode == 1) {
					var cover_size = ah - (text_left * 2);
					if (ppt.showAllItem && i == 0 && this.groups.length > 1) {
						gr.FillRectangle(ax + text_left, ay + text_left, cover_size, cover_size, g_colour_background);
						drawImage(gr, images.all, ax + text_left, ay + text_left, cover_size, cover_size, ppt.autoFill, normal_text & 0x25ffffff);
					} else {
						if (!group.cover_image) gr.FillRectangle(ax + text_left, ay + text_left, cover_size, cover_size, g_colour_background);
						drawImage(gr, group.cover_image || images.noart, ax + text_left, ay + text_left, cover_size, cover_size, ppt.autoFill, normal_text & 0x25ffffff);
					}
					text_left += cover_size + 8;
					text_width = aw - text_left - 16;
				}

				if (ppt.tagMode == 0) { // album
					gr.WriteText(group.album, g_font_bold, normal_text, ax + text_left, ay + (fh * 0.2), text_width, fh, 0, 0, 1, 1);

					if (ppt.panelMode == 0) { // no art
						gr.WriteText(str, g_font, fader_txt, ax + text_left, ay + (fh * 0.2) + fh, text_width, fh * 2, 0, 0, 1, 1);
					} else {
						str += "\r\n" + group.count + " track";
						if (group.count > 1) str += "s";
						str += ". " + group.duration + ".";
						gr.WriteText(str, g_font, fader_txt, ax + text_left, ay + (fh * 0.2) + fh, text_width, fh * 3, 0, 0, 1, 1);
					}
				} else { // artist/album artist, 1 line
					gr.WriteText(group.artist, g_font, normal_text, ax + text_left, ay, text_width, ah, 0, 2, 1, 1);
				}
				break;
			case 2:
				var text_left = 8;
				var cover_size = aw - (text_left * 2);

				if (i == this.selectedIndex) {
					drawSelectedRectangle(gr, ax, ay, aw, ah);
					normal_text = g_colour_selected_text;
					fader_txt = setAlpha(normal_text, 180);
				}

				if (ppt.showAllItem && i == 0 && this.groups.length > 1) {
					gr.FillRectangle(ax + text_left, ay + text_left, cover_size, cover_size, g_colour_background);
					drawImage(gr, images.all, ax + text_left, ay + text_left, cover_size, cover_size, ppt.autoFill, normal_text & 0x25ffffff);
				} else {
					if (group.cover_image) {
						drawImage(gr, group.cover_image, ax + text_left, ay + text_left, cover_size, cover_size, ppt.autoFill, normal_text & 0x25ffffff);
					} else {
						gr.FillRectangle(ax + text_left, ay + text_left, cover_size, cover_size, g_colour_background);
						drawImage(gr, images.noart, ax + text_left, ay + text_left, cover_size, cover_size, ppt.autoFill, normal_text & 0x25ffffff);
					}
				}

				if (ppt.tagMode == 0) {
					gr.WriteText(group.album, g_font_bold, normal_text, ax + text_left, ay + cover_size + (fh * 0.7), cover_size, fh, 2, 0, 1, 1);
					gr.WriteText(str, g_font, fader_txt, ax + text_left, ay + cover_size + (fh * 0.7) + fh, cover_size, fh * 2, 2, 0, 1, 1);
				} else {
					gr.WriteText(group.artist, g_font_bold, normal_text, ax + text_left, ay + cover_size + text_left, cover_size, fh * 3, 2, 2);
				}

				break;
			case 3: // auto-fil setting is ignored here and forced on. if turned off, it looks terrible with non square artist images
				if (ppt.showAllItem && i == 0 && this.groups.length > 1) {
					drawImage(gr, images.all, ax, ay, aw, ah, true, normal_text & 0x25ffffff);
				} else {
					drawImage(gr, group.cover_image || images.noart, ax, ay, aw, ah, true, normal_text & 0x25ffffff);
					var h = g_font_height * 3;
					var hh = h / 2;
					gr.FillRectangle(ax, ay + ah - h, aw, h, RGBA(0, 0, 0, 230));
					if (ppt.tagMode == 0) {
						gr.WriteText(group.album, g_font_bold, RGB(240, 240, 240), ax + 8, ay + ah - h + 2, aw - 16, hh, 0, 2, 1, 1);
						gr.WriteText(group.artist, g_font, RGB(230, 230, 230), ax + 8, ay + ah - hh - 2, aw - 16, hh, 0, 2, 1, 1);
					} else {
						gr.WriteText(group.artist, g_font, RGB(230, 230, 230), ax + 8, ay + ah - h, aw - 16, h, 0, 2, 1, 1);
					}
				}
				if (i == this.selectedIndex) {
					gr.DrawRectangle(ax + 1, ay + 1, aw - 3, ah - 3, 3.0, g_colour_selection);
				}
				break;
			}

			if (cx == this.totalColumns - 1) {
				cx = 0;
			} else {
				cx++;
			}
		}

		this.scrollbar.draw(gr);

		if (ppt.showHeaderBar) {
			var total = this.groups.length;
			var nb_groups = (ppt.showAllItem && total > 1 ? total - 1 : total);
			var boxText = nb_groups + " " + ppt.tagText[ppt.tagMode];
			if (nb_groups != 1) boxText += "s";
			draw_header_bar(gr, boxText, this)
		}
	}

	this._isHover = function (x, y) {
		return (x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h);
	}

	this.on_mouse = function (event, x, y, delta) {
		this.ishover = this._isHover(x, y);
		this.activeIndex = -1;
		if (this.ishover) {
			this.activeRow = Math.ceil((y + scroll_ - this.y) / this.rowHeight) - 1;
			if (y > this.y && x > this.x && x < this.x + this.w) {
				this.activeColumn = Math.ceil((x - this.x) / this.thumbnailWidth) - 1;
				this.activeIndex = (this.activeRow * this.totalColumns) + this.activeColumn;
				this.activeIndex = this.activeIndex > this.groups.length - 1 ? -1 : this.activeIndex;
			}
		}

		switch (event) {
		case "move":
			if (g_drag_drop && this.ishover && this.activeIndex > -1) {
				this.groups[this.activeIndex].handles.DoDragDrop(1);
				g_drag_drop = false;
			}
			break;
		case "lbtn_down":
		case "rbtn_down":
			if (this.ishover && this.activeIndex > -1 && this.activeIndex != this.selectedIndex) {
				this.activateItem(this.activeIndex)
				window.SetSelection(this.groups[this.activeIndex].handles, 6);
				this.repaint();
			}
			break;
		case "lbtn_dblclk":
			if (this.ishover && this.activeIndex > -1) {
				this.sendItemsToPlaylist(this.activeIndex);
			}
			break;
		case "rbtn_up":
			if (this.ishover && this.activeIndex > -1) {
				this.context_menu(x, y, this.activeIndex);
			} else if (!this.inputbox.hover) {
				this.settings_context_menu(x, y);
			}
			break;
		case "wheel":
			if (cScrollBar.visible) {
				this.scrollbar.updateScrollbar();
			}
			break;
		}

		if (ppt.showHeaderBar) {
			this.inputbox.check(event, x, y);

			if (this.inputbox.text.length > 0) {
				if (event == "lbtn_down" || event == "move") {
					this.reset_bt.checkstate(event, x, y);
				} else if (event == "lbtn_up") {
					if (this.reset_bt.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
						this.inputbox.text = "";
						this.inputbox.offset = 0;
						g_sendResponse();
					}
				}
			}
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

		scroll = check_scroll(scroll);
		if (Math.abs(scroll - scroll_) >= 1) {
			scroll_ += (scroll - scroll_) / ppt.scrollSmoothness;
			isScrolling = true;
			need_repaint = true;
			if (scroll_prev != scroll)
				brw.scrollbar.updateScrollbar();
		} else {
			if (scroll_ != scroll) {
				scroll_ = scroll;
				need_repaint = true;
			}
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

	this.context_menu = function (x, y, albumIndex) {
		var menu = window.CreatePopupMenu();
		var sub = window.CreatePopupMenu();
		var add = window.CreatePopupMenu()
		var context = fb.CreateContextMenuManager();;
		var ap = plman.ActivePlaylist;

		menu.AppendMenuItem(EnableMenuIf(playlist_can_add_items(ap)), 1, "Add to current playlist");
		menu.AppendMenuItem(MF_STRING, 2, "Add to new playlist");

		for (var i = 0; i < plman.PlaylistCount; i++) {
			add.AppendMenuItem(EnableMenuIf(playlist_can_add_items(i)), i + 10, plman.GetPlaylistName(i));
		}
		add.AppendTo(menu, MF_STRING, "Add to other playlist");
		menu.AppendMenuSeparator();

		sub.AppendMenuItem(MF_STRING, 1000, "Send to default playlist and play");
		sub.AppendMenuItem(MF_STRING, 1001, "Send to default playlist");
		sub.CheckMenuRadioItem(1000, 1001, ppt.sendto_playlist_play ? 1000 : 1001);
		sub.AppendMenuSeparator();

		sub.AppendMenuItem(MF_STRING, 1002, "Default playlist name")
		sub.AppendTo(menu, MF_STRING, "Double click");

		menu.AppendMenuSeparator();
		context.InitContext(this.groups[albumIndex].handles);
		context.BuildMenu(menu, 10000);

		var idx = menu.TrackPopupMenu(x, y);
		menu.Dispose();

		switch (true) {
		case idx == 0:
			break;
		case idx == 1:
			var base = plman.GetPlaylistItemCount(ap);
			plman.InsertPlaylistItems(ap, base, this.groups[albumIndex].handles);
			break;
		case idx == 2:
			var name = ppt.tfos[ppt.tagMode].EvalWithMetadb(this.groups[albumIndex].handles.GetItem(0));
			var p = plman.CreatePlaylist(plman.PlaylistCount, name);
			plman.ActivePlaylist = p
			plman.InsertPlaylistItems(p, 0, this.groups[albumIndex].handles);
			break;
		case idx < 1000:
			var target_playlist = idx - 10;
			plman.UndoBackup(target_playlist);
			var base = plman.GetPlaylistItemCount(target_playlist);
			plman.InsertPlaylistItems(target_playlist, base, this.groups[albumIndex].handles);
			plman.ActivePlaylist = target_playlist;
			break;
		case idx == 1000:
		case idx == 1001:
			ppt.sendto_playlist_play = idx == 1000;
			window.SetProperty("SMOOTH.SENDTO.PLAYLIST.PLAY", ppt.sendto_playlist_play);
			break;
		case idx == 1002:
			var tmp = utils.InputBox("Enter default playlist name", window.Name, ppt.sendto_playlist);
			if (tmp.length && tmp != ppt.sendto_playlist) {
				ppt.sendto_playlist = tmp;
				window.SetProperty("SMOOTH.SENDTO.PLAYLIST", ppt.sendto_playlist);
			}
			break;
		default:
			context.ExecuteByID(idx - 10000);
			break;
		}

		context.Dispose();
		return true;
	}

	this.settings_context_menu = function (x, y) {
		var menu = window.CreatePopupMenu();
		var sub = window.CreatePopupMenu();

		menu.AppendMenuItem(CheckMenuIf(ppt.showHeaderBar), 1, "Header Bar");
		menu.AppendMenuSeparator();

		var colour_flag = EnableMenuIf(ppt.enableCustomColours);
		sub.AppendMenuItem(CheckMenuIf(ppt.enableDynamicColours), 2, "Enable Dynamic");
		sub.AppendMenuItem(CheckMenuIf(ppt.enableCustomColours), 3, "Enable Custom");
		sub.AppendMenuSeparator();
		sub.AppendMenuItem(colour_flag, 4, "Text");
		sub.AppendMenuItem(colour_flag, 5, "Background");
		sub.AppendMenuItem(colour_flag, 6, "Selected background");
		sub.AppendTo(menu, MF_STRING, "Colours");
		menu.AppendMenuSeparator();

		menu.AppendMenuItem(MF_STRING, 20, "Album");
		menu.AppendMenuItem(MF_STRING, 21, "Artist");
		menu.AppendMenuItem(MF_STRING, 22, "Album Artist");
		menu.CheckMenuRadioItem(20, 22, 20 + ppt.tagMode);
		menu.AppendMenuSeparator();
		menu.AppendMenuItem(MF_STRING, 23, "Sort pattern...");
		menu.AppendMenuSeparator();

		menu.AppendMenuItem(MF_STRING, 30, "Column");
		menu.AppendMenuItem(MF_STRING, 31, "Column + Album Art");
		menu.AppendMenuItem(MF_STRING, 32, "Album Art Grid (Original style)");
		menu.AppendMenuItem(MF_STRING, 33, "Album Art Grid (Overlayed text)");
		menu.CheckMenuRadioItem(30, 33, 30 + ppt.panelMode);
		menu.AppendMenuSeparator();

		menu.AppendMenuItem(CheckMenuIf(ppt.showAllItem), 40, "Show all items");
		menu.AppendMenuItem(GetMenuFlags(ppt.panelMode == 1 || ppt.panelMode == 2, ppt.autoFill), 41, "Album Art: Auto-fill");
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
		case 20:
		case 21:
		case 22:
			ppt.tagMode = idx - 20;
			window.SetProperty("SMOOTH.TAG.MODE", ppt.tagMode);
			this.populate();
			break;
		case 23:
			switch (ppt.tagMode) {
			case 0:
				var tmp = utils.InputBox('Enter sort pattern for "Album"', window.Name, ppt.sort_album_tf);
				if (tmp != ppt.sort_album_tf) {
					ppt.sort_album_tf = tmp;
					window.SetProperty("SMOOTH.SORT.ALBUM", ppt.sort_album_tf);
					this.populate();
				}
				break;
			case 1:
				var tmp = utils.InputBox('Enter sort pattern for "Artist"', window.Name, ppt.sort_artist_tf);
				if (tmp != ppt.sort_artist_tf) {
					ppt.sort_artist_tf = tmp;
					window.SetProperty("SMOOTH.SORT.ARTIST", ppt.sort_artist_tf);
					this.populate();
				}
				break;
			case 2:
				var tmp = utils.InputBox('Enter sort pattern for "Album Artist"', window.Name, ppt.sort_album_artist_tf);
				if (tmp != ppt.sort_album_artist_tf) {
					ppt.sort_album_artist_tf = tmp;
					window.SetProperty("SMOOTH.SORT.ALBUM.ARTIST", ppt.sort_album_artist_tf);
					this.populate();
				}
				break;
			}
			break;
		case 30:
		case 31:
		case 32:
		case 33:
			ppt.panelMode = idx - 30;
			window.SetProperty("SMOOTH.DISPLAY.MODE", ppt.panelMode);
			get_metrics();
			this.repaint();
			break;
		case 40:
			ppt.showAllItem = !ppt.showAllItem;
			window.SetProperty("SMOOTH.SHOW.ALL.ITEMS", ppt.showAllItem);
			this.populate();
			break;
		case 41:
			ppt.autoFill = !ppt.autoFill;
			window.SetProperty("SMOOTH.AUTO.FILL", ppt.autoFill);
			images.clear();
			this.populate();
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

	this.groups = [];
	this.rowsCount = 0;
	this.scrollbar = new oScrollbar();
	this.selectedIndex = -1;
	this.inputbox = new oInputbox(300, scale(20), true, "", "Filter", g_sendResponse);
}

function oGroup(index, start, metadb, groupkey, cachekey) {
	this.index = index;
	this.start = start;
	this.count = 1;
	this.metadb = metadb;
	this.groupkey = groupkey;
	this.cachekey = cachekey;
	this.cover_image = null;
	this.image_requested = false;

	var arr = this.groupkey.split(" ^^ ");
	this.artist = arr[0];
	this.album = arr[1] || "";
	this.date = arr[2] || "";

	this.finalise = function (handles) {
		this.handles = handles.Clone();
		this.count = this.handles.Count;
		this.duration = utils.FormatDuration(this.handles.CalcTotalDuration());
	}
}

function get_metrics() {
	switch (ppt.panelMode) {
	case 0:
	case 1:
		ppt.rowScrollStep = 3;
		break;
	case 2:
	case 3:
		ppt.rowScrollStep = 1;
		break;
	}

	if (ppt.showHeaderBar) {
		ppt.headerBarHeight = scale(ppt.defaultHeaderBarHeight);
	} else {
		ppt.headerBarHeight = 0;
	}
	cScrollBar.width = scale(cScrollBar.defaultWidth);
	cScrollBar.minCursorHeight = scale(cScrollBar.defaultMinCursorHeight);

	brw.setSize();
}

function check_scroll(scroll___) {
	if (scroll___ < 0)
		scroll___ = 0;
	var g1 = brw.h - (brw.totalRowsVis * brw.rowHeight);
	var end_limit = (brw.rowsCount * brw.rowHeight) - (brw.totalRowsVis * brw.rowHeight) - g1;
	if (scroll___ != 0 && scroll___ > end_limit) {
		scroll___ = end_limit;
	}
	return scroll___;
}

function g_sendResponse() {
	if (brw.inputbox.text.length == 0) {
		g_filter_text = "";
	} else {
		g_filter_text = brw.inputbox.text;
	}
	brw.populate();
}

ppt.sort_album_tf = window.GetProperty("SMOOTH.SORT.ALBUM", "%album artist% | %date% | %album% | %discnumber% | %tracknumber% | %title%");
ppt.sort_artist_tf = window.GetProperty("SMOOTH.SORT.ARTIST", "$meta(artist,0) | %date% | %album% | %discnumber% | %tracknumber% | %title%");
ppt.sort_album_artist_tf = window.GetProperty("SMOOTH.SORT.ALBUM.ARTIST", "%album artist% | %date% | %album% | %discnumber% | %tracknumber% | %title%");

ppt.panelMode = window.GetProperty("SMOOTH.DISPLAY.MODE", 2); // 0 = column, 1 = column + art, 2 = album art grid, 3 - album art grid + overlay text
ppt.sendto_playlist = window.GetProperty("SMOOTH.SENDTO.PLAYLIST", "Library selection");
ppt.sendto_playlist_play = window.GetProperty("SMOOTH.SENDTO.PLAYLIST.PLAY", true);
ppt.showAllItem = window.GetProperty("SMOOTH.SHOW.ALL.ITEMS", true);
ppt.tagMode = window.GetProperty("SMOOTH.TAG.MODE", 0); // 0 = album, 1 = artist, 2 = album artist
ppt.tagText = ["album", "artist", "album artist"];
ppt.tfos = [
	fb.TitleFormat("%album artist% - %album%"),
	fb.TitleFormat("%artist%"),
	fb.TitleFormat("%album artist%")
]

ppt.default_thumbnailWidthMin = window.GetProperty("SMOOTH.THUMB.MIN.WIDTH", 130);
ppt.thumbnailWidthMin = ppt.default_thumbnailWidthMin;
ppt.default_lineHeightMin = window.GetProperty("SMOOTH.LINE.MIN.HEIGHT", 120);
ppt.lineHeightMin = ppt.default_lineHeightMin;

var tfo = {
	groupkey_album : fb.TitleFormat("$if2(%album artist%,Unknown Artist) ^^ $if2(%album%,'('Singles')') ^^ [$year(%date%)] ^^ $crc32(%path%)"),
	groupkey_artist : fb.TitleFormat("$if2($meta(artist,0),Unknown Artist) ^^ $crc32(artists$meta(artist,0))"),
	groupkey_album_artist : fb.TitleFormat("%album artist% ^^ $crc32(artists%album artist%)"),
};

var g_drag_drop = false;
var g_filter_text = "";
var brw = new oBrowser();

get_metrics();
