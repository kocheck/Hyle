import React from 'react';

const Sidebar = () => {
    const handleDragStart = (e: React.DragEvent, type: string, src: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, src }));
        // Also set a drag image if we want
    };

    return (
        <div className="w-64 bg-neutral-800 border-r border-neutral-700 flex flex-col p-4 z-10 shrink-0">
            <h2 className="text-xl font-bold mb-4">Library</h2>

            <div className="mb-4">
                <h3 className="text-sm text-neutral-400 mb-2 uppercase font-bold">Tokens</h3>
                <div className="grid grid-cols-2 gap-2">
                     <div
                        className="bg-neutral-700 w-full aspect-square rounded cursor-grab flex items-center justify-center hover:bg-neutral-600 transition"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'LIBRARY_TOKEN', 'https://konvajs.org/assets/lion.png')}
                     >
                        🦁
                    </div>
                     <div
                        className="bg-neutral-700 w-full aspect-square rounded cursor-grab flex items-center justify-center hover:bg-neutral-600 transition"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'LIBRARY_TOKEN', 'https://konvajs.org/assets/yoda.jpg')}
                     >
                        👽
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
