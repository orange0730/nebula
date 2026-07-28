import { classNameFactory } from "@utils/css";
import { useState } from "@webpack/common";

import { deleteWorkspace, listWorkspaceNames, loadWorkspace, saveWorkspace } from "../workspaces";

const cl = classNameFactory("nebula-wsmenu-");

interface Props {
    onClose: () => void;
}

export function WorkspaceMenu({ onClose }: Props) {
    const [names, setNames] = useState(() => listWorkspaceNames());
    const [newName, setNewName] = useState("");

    const refresh = () => setNames(listWorkspaceNames());

    return (
        <div className={cl("root")} onPointerDown={e => e.stopPropagation()}>
            <div className={cl("save-row")}>
                <input
                    className={cl("input")}
                    placeholder="版面名稱..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && newName.trim()) {
                            saveWorkspace(newName);
                            setNewName("");
                            refresh();
                        }
                    }}
                />
                <button
                    className={cl("save-btn")}
                    disabled={!newName.trim()}
                    onClick={() => {
                        if (!newName.trim()) return;
                        saveWorkspace(newName);
                        setNewName("");
                        refresh();
                    }}
                >
                    儲存目前版面
                </button>
            </div>
            <div className={cl("list")}>
                {names.length === 0 && <div className={cl("empty")}>還沒有儲存的版面</div>}
                {names.map(name => (
                    <div key={name} className={cl("item")}>
                        <span className={cl("item-name")} onClick={() => { loadWorkspace(name); onClose(); }}>
                            {name}
                        </span>
                        <button
                            className={cl("delete-btn")}
                            onClick={() => { deleteWorkspace(name); refresh(); }}
                            title="刪除"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
