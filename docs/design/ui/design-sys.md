<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Org Chart - Group Icon Logic</title>
    <style>
        /* --- [BASE STYLES RETAINED] --- */
        :root {
            --bg-canvas: #0f172a;
            --bg-panel: #1e293b;
            --bg-surface: #334155;
            --border-color: #475569;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-orange: #f97316;
            --accent-green: #10b981;
            --font-ui: 'Inter', -apple-system, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        body {
            background-color: var(--bg-canvas);
            color: var(--text-primary);
            font-family: var(--font-ui);
            margin: 0;
            height: 100vh;
            display: flex;
            justify-content: flex-end;
            overflow: hidden;
        }

        .inspector-panel {
            width: 400px;
            height: 100%;
            background-color: var(--bg-panel);
            border-left: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            box-shadow: -10px 0 30px rgba(0,0,0,0.5);
        }

        .panel-header { padding: 24px; border-bottom: 1px solid var(--border-color); background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-panel) 100%); }
        .unit-identity { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .unit-logo { width: 64px; height: 64px; background-color: var(--bg-canvas); border: 1px solid var(--border-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
        .unit-title h1 { font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; }
        .unit-title span { font-family: var(--font-mono); font-size: 11px; color: var(--accent-orange); letter-spacing: 0.1em; text-transform: uppercase; }
        
        .panel-services { padding: 24px; overflow-y: auto; flex-grow: 1; }
        .section-label { font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: block; }
        .service-list { display: flex; flex-direction: column; gap: 8px; }

        /* --- SERVICE TILE --- */
        .service-tile {
            background-color: var(--bg-surface);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            display: flex;
            align-items: stretch;
            height: 56px;
            position: relative;
        }

        .service-trigger {
            flex-grow: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 16px;
            cursor: pointer;
            border-right: 1px solid rgba(255,255,255,0.05);
        }
        
        .service-tile:hover .service-trigger { background-color: rgba(255,255,255,0.05); }
        .service-icon { color: var(--accent-orange); width: 20px; height: 20px; }
        .service-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }

        /* --- THE OWNER COMPONENT --- */
        .service-owner {
            width: 56px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background-color: rgba(0,0,0,0.1);
            position: relative;
            color: var(--text-secondary); /* Default icon color */
        }

        .service-owner:hover { 
            background-color: rgba(0,0,0,0.2); 
            color: var(--text-primary); /* Brighten icon on hover */
        }

        /* TYPE A: The Group Icon Container */
        .owner-icon-container {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* TYPE B: The Individual Avatar Container */
        .owner-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #64748b;
            border: 2px solid var(--bg-surface);
            background-size: cover;
        }

        .owner-label {
            font-family: var(--font-mono); font-size: 8px;
            color: var(--text-secondary); margin-top: 4px; text-transform: uppercase;
        }

        /* --- THE TEAM POPOVER --- */
        .team-popover {
            display: none;
            position: absolute;
            top: 50px; right: 0; width: 220px;
            background-color: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 100;
            padding: 8px;
            flex-direction: column;
            gap: 4px;
        }

        .service-owner:hover .team-popover { display: flex; }

        .popover-header { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; padding: 4px 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 4px; display: flex; justify-content: space-between; }
        .popover-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .popover-row:hover { background-color: var(--bg-surface); }
        .mini-avatar { width: 20px; height: 20px; border-radius: 50%; background-color: #64748b; }
        .mini-info { flex-grow: 1; display: flex; flex-direction: column; }
        .mini-name { font-size: 11px; font-weight: 500; color: var(--text-primary); }
        .mini-role { font-size: 9px; color: var(--text-secondary); }
        .mini-status { width: 6px; height: 6px; border-radius: 50%; background-color: var(--accent-green); }

        svg { width: 100%; height: 100%; fill: currentColor; }

    </style>
</head>
<body>

    <div class="inspector-panel">
        <div class="panel-header">
            <div class="unit-identity">
                <div class="unit-logo">N1</div>
                <div class="unit-title"><span>Admin Department</span><h1>N1 Administration</h1></div>
            </div>
        </div>

        <div class="panel-services">
            <span class="section-label">Available Services & POCs</span>
            <div class="service-list">
                
                <div class="service-tile" style="z-index: 10;">
                    <div class="service-trigger">
                        <div class="service-icon"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
                        <span class="service-name">Official Travel (DTS)</span>
                    </div>
                    
                    <div class="service-owner">
                        <div class="owner-icon-container">
                            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        </div>
                        <span class="owner-label">Team</span>

                        <div class="team-popover">
                            <div class="popover-header"><span>Travel Shop</span></div>
                            <div class="popover-row">
                                <div class="mini-avatar"></div>
                                <div class="mini-info"><span class="mini-name">LS1 Miller</span><span class="mini-role">LPO</span></div>
                            </div>
                            <div class="popover-row">
                                <div class="mini-avatar" style="background-color: #475569"></div>
                                <div class="mini-info"><span class="mini-name">LS2 Davis</span><span class="mini-role">Clerk</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="service-tile" style="z-index: 1;">
                    <div class="service-trigger">
                        <div class="service-icon"><svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg></div>
                        <span class="service-name">Submit Leave Request</span>
                    </div>
                    
                    <div class="service-owner">
                        <div class="owner-avatar" style="background-color: #475569;"></div>
                        <span class="owner-label">POC</span>
                    </div>
                </div>

            </div>
        </div>
    </div>
</body>
</html>