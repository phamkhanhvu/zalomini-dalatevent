import React, { useState } from "react";
import { useSnackbar } from "../ui";
import { Program } from "../data/festival";
import { useSaved } from "../utils/saved";
import { SAVED_MSG, SHARE_FAIL } from "../utils/platform";
import { ProgramSheet } from "./program-sheet";

/** Gom phần mở chi tiết + lưu chương trình để các trang dùng chung */
export function useProgramSheet() {
  const [open, setOpen] = useState<Program | null>(null);
  const saved = useSaved();
  const { openSnackbar } = useSnackbar();

  const toggleSave = (p: Program) => {
    const on = saved.toggle(p.id);
    openSnackbar({
      text: on ? SAVED_MSG : "Đã bỏ lưu",
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
        if (!ok) openSnackbar({ text: SHARE_FAIL, duration: 2200 });
      }}
    />
  );

  return { sheet, openProgram: setOpen, toggleSave, saved };
}
