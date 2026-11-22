/**
 * Bản thay thế zmp-ui cho app iOS: chỉ gồm những thành phần app đang dùng.
 */
import React, { createContext, FC, ReactElement, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { MemoryRouter } from "react-router";

export const App: FC<{ children?: ReactNode }> = ({ children }) => <>{children}</>;

export const ZMPRouter: FC<{ children?: ReactNode }> = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

/* ---------- Thông báo ngắn ---------- */
interface SnackOptions {
  text: string;
  type?: string;
  duration?: number;
}
const SnackContext = createContext<{ openSnackbar: (o: SnackOptions) => void }>({ openSnackbar: () => {} });

export const SnackbarProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [snack, setSnack] = useState<SnackOptions | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const openSnackbar = useCallback((o: SnackOptions) => {
    window.clearTimeout(timer.current);
    setSnack(o);
    timer.current = window.setTimeout(() => setSnack(null), o.duration ?? 2000);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <SnackContext.Provider value={{ openSnackbar }}>
      {children}
      <div className={"nx-snack" + (snack ? " is-on" : "")} role="status" aria-live="polite">
        {snack?.text}
      </div>
    </SnackContext.Provider>
  );
};

export function useSnackbar() {
  return useContext(SnackContext);
}

/* ---------- Thanh điều hướng dưới ---------- */
interface ItemProps {
  label: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
}
const Item: FC<ItemProps> = () => null;

interface NavProps {
  id?: string;
  activeKey: string;
  onChange: (key: string) => void;
  children: ReactNode;
}
const Nav: FC<NavProps> = ({ id, activeKey, onChange, children }) => (
  <nav id={id} className="nx-nav">
    {React.Children.map(children, (child) => {
      const el = child as ReactElement<ItemProps>;
      const key = String(el.key);
      const active = key === activeKey;
      return (
        <button
          type="button"
          className={"zaui-bottom-navigation-item" + (active ? " zaui-bottom-navigation-item-active" : "")}
          aria-current={active ? "page" : undefined}
          onClick={() => onChange(key)}
        >
          <span className="nx-nav-icon">{active && el.props.activeIcon ? el.props.activeIcon : el.props.icon}</span>
          <span className="nx-nav-label">{el.props.label}</span>
        </button>
      );
    })}
  </nav>
);
export const BottomNavigation = Object.assign(Nav, { Item });

/* ---------- Bảng trượt từ dưới lên ---------- */
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children?: ReactNode;
  autoHeight?: boolean;
  mask?: boolean;
  handler?: boolean;
  swipeToClose?: boolean;
}
export const Sheet: FC<SheetProps> = ({ visible, onClose, children }) => {
  const startY = useRef<number | null>(null);
  return (
    <div className={"nx-sheet" + (visible ? " is-on" : "")} aria-hidden={!visible}>
      <div className="nx-sheet-mask" onClick={onClose} />
      <div
        className="nx-sheet-panel"
        role="dialog"
        aria-modal="true"
        onTouchStart={(e) => {
          startY.current = e.currentTarget.scrollTop <= 0 ? e.touches[0].clientY : null;
        }}
        onTouchEnd={(e) => {
          if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 90) onClose();
          startY.current = null;
        }}
      >
        <button type="button" className="nx-sheet-handle" aria-label="Đóng" onClick={onClose} />
        {children}
      </div>
    </div>
  );
};
