import React, { useState } from "react";
import { useSnackbar } from "zmp-ui";
import { Program } from "../data/festival";
import { useSaved } from "../utils/saved";
import { ProgramSheet } from "./program-sheet";

/** Gom phần mở chi tiết + lưu chương trình để các trang dùng chung */
export function useProgramSheet() {
  const [open, setOpen] = useState<Program | null>(null);
  const saved = useSaved();
  const { openSnackbar } = useSnackbar();

  const toggleSave = (p: Program) => {
    const on = saved.toggle(p.id);
    openSnackbar({
      text: on ? "Đã lưu vào mục Đã lưu" : "Đã bỏ lưu",
      type: "success",
      duration: 1800,
    });
  };

  const sheet = (
    <ProgramSheet
      program={open}
      saved={open ? saved.has(open.id) : false}
      onClose={() => setOpen(null)}
      onToggleSave={toggleSave}
      onShared={(ok) => {
        if (!ok) openSnackbar({ text: "Chưa chia sẻ được, hãy thử lại trong Zalo", duration: 2200 });
      }}
    />
  );

  return { sheet, openProgram: setOpen, toggleSave, saved };
}
