/*
 * Dirty Tree Warning: an Obsidian plugin.
 * Copyright (C) 2026 Top Tier Content
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version. This program is distributed WITHOUT ANY WARRANTY. See the LICENSE file.
 */

const { Plugin, Modal, Notice, FileSystemAdapter } = require("obsidian");
const { execFileSync } = require("child_process");

class DirtyTreeModal extends Modal {
  constructor(app, onQuit) {
    super(app);
    this.onQuit = onQuit;
  }

  onOpen() {
    this.modalEl.addClass("dirty-tree-modal");
    if (this.onQuit) {
      // Display-only while Obsidian is closing
      this.modalEl.addClass("dirty-tree-modal-quit");
    }
    const message = this.contentEl.createDiv({ cls: "dirty-tree-message" });
    message.createDiv({ text: "DIRTY TREE!" });
    message.createDiv({ text: "CLEAN YOUR REPO" });
  }

  onClose() {
    this.contentEl.empty();
  }
}

module.exports = class DirtyTreeWarning extends Plugin {
  onload() {
    this.shownOnQuit = false;

    // When Obsidian begins to close, show the warning if the working tree is dirty.
    // Obsidian still closes on its own a few seconds later; this plugin does not
    // prevent closing. A clean tree, or a vault that is not in a Git repository,
    // closes normally with no warning.
    this.registerDomEvent(
      window,
      "beforeunload",
      (event) => {
        if (!this.isDirty()) return;
        event.preventDefault();
        event.returnValue = false;
        if (!this.shownOnQuit) {
          this.shownOnQuit = true;
          new DirtyTreeModal(this.app, true).open();
        }
      },
      true
    );

    this.addCommand({
      id: "preview-warning",
      name: "Preview warning",
      callback: () => new DirtyTreeModal(this.app, false).open()
    });

    this.addCommand({
      id: "check-working-tree",
      name: "Check working tree now",
      callback: () => {
        const message = this.isDirty()
          ? "The Git working tree has uncommitted changes."
          : "The Git working tree is clean, or the vault is not in a Git repository.";
        new Notice(message);
      }
    });
  }

  getVaultPath() {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getBasePath();
    }
    return null;
  }

  // True only when the vault is inside a Git repository AND `git status` reports
  // changes. Any failure (Git not installed, not a repository, timeout) is treated
  // as "not dirty" so Obsidian closes normally.
  isDirty() {
    const vaultPath = this.getVaultPath();
    if (!vaultPath) return false;
    try {
      const output = execFileSync("git", ["status", "--porcelain"], {
        cwd: vaultPath,
        timeout: 1000,
        stdio: ["ignore", "pipe", "ignore"]
      });
      return output.toString().trim().length > 0;
    } catch (error) {
      return false;
    }
  }
};
