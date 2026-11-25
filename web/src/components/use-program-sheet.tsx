import React, { useState } from "react";
import { useSnackbar } from "../ui";
import { Program } from "../data/festival";
import { useSaved } from "../utils/saved";
import { savedMsg, shareFail } from "../utils/platform";
import { ProgramSheet } from "./program-sheet";
import { tr } from "../i18n";

/** Gom phần mở chi tiết + lưu chương trình để các trang dùng chung */
export function useProgramSheet() {
  const [open, setOpen] = useState<Program | null>(null);
  const saved = useSaved();
  const { openSnackbar } = useSnackbar();

  const toggleSave = (p: Program) => {
    const on = saved.toggle(p.id);
    openSnackbar({
      text: on ? savedMsg() : tr("Đã bỏ lưu", "Removed"),
      type: "success",
      duration: 2400,
    });
  };

  const sheet = (
    <ProgramSheet
      program={open}
      saved={open ? saved.has(open.id) : false}
      onClose={() => setOpen(null)}
      onToggleSave={toggleSave}
      onShared={(ok) => {
        if (!ok) openSnackbar({ text: shareFail(), duration: 2200 });
      }}
    />
  );

  return { sheet, openProgram: setOpen, toggleSave, saved };
}
