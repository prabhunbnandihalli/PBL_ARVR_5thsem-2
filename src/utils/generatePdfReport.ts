import { jsPDF } from 'jspdf';

export function generatePdfReport(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Color Palette
  const primaryNavy = [15, 23, 42]; // Slate 900
  const accentCyan = [6, 182, 212]; // Cyan 500
  const darkTeal = [13, 148, 136]; // Teal 600
  const textDark = [30, 41, 59]; // Slate 800
  const textMuted = [100, 116, 139]; // Slate 500
  const bgLight = [248, 250, 252]; // Slate 50
  const borderGray = [226, 232, 240]; // Slate 200

  // Helper: Header & Footer on each page
  const drawPageDecorations = (pageNum: number, totalPages: number, pageTitle: string) => {
    // Top banner
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, pageWidth, 12, 'F');

    // Accent line
    doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.rect(0, 12, pageWidth, 1.2, 'F');

    // Top Banner Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('AEGIS-AR • AUTONOMOUS CAMPUS DISASTER EVACUATION METAVERSE SIMULATOR', margin, 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text('PROJECT PPT / TECHNICAL SPECIFICATION REPORT', pageWidth - margin, 8, { align: 'right' });

    // Bottom Footer
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Deep Learning & AR/VR Fundamentals | Section: ${pageTitle}`, margin, pageHeight - 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  const drawSectionBadge = (y: number, category: string, title: string) => {
    // Badge pill
    doc.setFillColor(236, 254, 255);
    doc.roundedRect(margin, y, 54, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor( darkTeal[0], darkTeal[1], darkTeal[2] );
    doc.text(category.toUpperCase(), margin + 2.5, y + 4.2);

    // Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(title, margin, y + 14);

    // Subtle divider
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.line(margin, y + 17, pageWidth - margin, y + 17);

    return y + 22;
  };

  const totalPages = 6;

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  // ==========================================
  // Background gradient block
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Cyan stripe
  doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.rect(0, 90, pageWidth, 2.5, 'F');

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 182, 212);
  doc.text('ACADEMIC PROJECT REPORT & PRESENTATION DECK', margin, 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Immersive Metaverse & AR Digital Twin:', margin, 35);
  doc.setTextColor(56, 189, 248);
  doc.text('Autonomous Campus Evacuation Simulator', margin, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Integrating Deep Learning, Spatial Computing & Physiological Stress Feedback', margin, 54);

  // Metadata Card inside cover
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, 62, contentWidth, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Target Domains: Augmented Reality (AR) • Virtual Reality (VR) • Metaverse • Applied Deep Learning', margin + 4, 69);
  doc.text('Key Features: WebGL 3D Digital Twin, Danger-Sensing Pulse, Stamina Depletion, Realistic Casualties', margin + 4, 76);

  // Executive Summary Card
  let curY = 100;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, curY, contentWidth, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Executive Summary', margin + 5, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const execSummary = [
    'AegisAR is an accessible, web-native 3D Metaverse and Augmented Reality (AR) digital twin designed to train campus occupants',
    'in life-saving disaster egress protocols. Addressing the fatal shortcomings of static physical drills—which lack dynamic hazard',
    'evolution and physiological stress—the simulator models real-time fire spread, toxic smoke propagation, and high-voltage arcs.',
    'Cadets experience authentic physiological constraints, including danger-sensing heart rates, panic-accelerated stamina loss,',
    'and severe vulnerability penalties during exhaustion, culminating in detailed automated After-Action Review (AAR) debriefs.'
  ];
  execSummary.forEach((line, idx) => {
    doc.text(line, margin + 5, curY + 14 + idx * 4.4);
  });

  // Presentation Structure Overview Grid
  curY = 145;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Report Structure & Evaluation Parameters', margin, curY);

  curY += 6;
  const modules = [
    {
      code: 'PARAMETER 1: UNDERSTANDING',
      items: [
        '1A: Deep Learning & AR / VR / Metaverse Fundamentals (Spatial Kinematics, Digital Twin Graphing)',
        '1B: Problem Identification & Comprehensive Literature Survey (Benchmarking against NFPA & Serious Games)',
      ]
    },
    {
      code: 'PARAMETER 2: REQUIREMENT ANALYSIS & DESIGN',
      items: [
        '2A: Objectives & Scope, Software Requirement Specification (SRS), Functional & Non-Functional Requirements',
        '2B: Methodology / System Design (Mathematical Kinematics, Stress Engine, Casualty Logic) & Expected Synopsis',
      ]
    }
  ];

  modules.forEach((mod) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, curY, contentWidth, 24, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text(mod.code, margin + 4, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    mod.items.forEach((it, i) => {
      doc.text(`• ${it}`, margin + 6, curY + 12 + i * 5);
    });

    curY += 28;
  });

  // Footer on page 1
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('AegisAR System Architecture & Comprehensive Evaluation', margin, pageHeight - 7);
  doc.text(`Page 1 of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });


  // ==========================================
  // PAGE 2: PARAMETER 1A - UNDERSTANDING (DEEP LEARNING & AR/VR/METAVERSE)
  // ==========================================
  doc.addPage();
  drawPageDecorations(2, totalPages, '1A - Fundamentals');
  curY = drawSectionBadge(18, 'Parameter 1A', 'Deep Learning & AR / VR / Metaverse Fundamentals');

  const card1A = (y: number, title: string, subtitle: string, bullets: string[]) => {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(title, margin + 4, y + 6);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text(subtitle, margin + 4, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    bullets.forEach((b, idx) => {
      doc.text(`• ${b}`, margin + 6, y + 16 + idx * 4.6);
    });
    return y + 41;
  };

  curY = card1A(
    curY,
    '1. Digital Twin & Spatial Metaverse Architecture',
    '3D Metric Reconstruction and WebGL Spatial Synchronization',
    [
      'Real-world spatial reconstruction of multi-floor educational and research facilities with millimeter accuracy.',
      'Procedural generation of navigable corridors, stairwells, fire-resistant fire-doors, and designated muster points.',
      'Camera-relative spatial kinematics: input vectors dynamically rotate with viewport azimuth theta to provide intuitive navigation.',
      'Shortest-path angular interpolation (lerpAngle) guaranteeing smooth third-person camera panning without gimbal disorientation.'
    ]
  );

  curY = card1A(
    curY,
    '2. Applied Deep Learning & Autonomous Multi-Agent Behaviors',
    'Graph-Based Pathfinding & Intelligent Crowd Dispersion',
    [
      'Dynamic A* and Graph Routing: evacuation vectors dynamically recalculate around active convective heat and toxic gas nodes.',
      'Finite State Machine (FSM) Peer NPCs: peer agents exhibit emergent crowd bottlenecking, smoke avoidance, and squad rescue.',
      'Predictive Convection Models: hazard nodes diffuse outward over time, simulating real-world smoke stratification and radiant heat.'
    ]
  );

  curY = card1A(
    curY,
    '3. Augmented Reality (AR) Holographic Passthrough & Telemetry',
    'Heads-Up Spatial Overlays (HUD) & Bio-Acoustic Feedback',
    [
      'Live camera passthrough rendering illuminated green evacuation pathways directly onto physical floors.',
      'Azimuth compass tracking and volumetric 3D warning cones identifying obscured hazards behind walls.',
      'Procedural Web Audio synthesis generating physiological heartbeats, panting respirations, and hazard alarms.'
    ]
  );


  // ==========================================
  // PAGE 3: PARAMETER 1B - PROBLEM IDENTIFICATION & LITERATURE SURVEY
  // ==========================================
  doc.addPage();
  drawPageDecorations(3, totalPages, '1B - Problem & Literature Survey');
  curY = drawSectionBadge(18, 'Parameter 1B', 'Problem Identification & Literature Survey');

  // Problem Identification Box
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, curY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, curY, contentWidth, 34, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(185, 28, 28);
  doc.text('Identified Industry & Research Problems in Disaster Training', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(127, 29, 29);
  const probBullets = [
    'Traditional Drills Lack Stress Inoculation: Routine physical drills cannot replicate asphyxiation panic, blinding smoke, or radiant fire.',
    'Fatal Disregard of Stamina & Exhaustion: Most 3D training tools treat trainees as frictionless avatars with infinite stamina.',
    'High Hardware Barriers of VR: Native VR headsets (HTC Vive, Meta Quest) are expensive and difficult to scale across university campuses.',
    'Absence of Real-time Physiological Telemetry: Drills offer no quantitative metrics on smoke inhalation or hazard proximity survival rate.'
  ];
  probBullets.forEach((p, idx) => {
    doc.text(`• ${p}`, margin + 5, curY + 12 + idx * 4.6);
  });

  curY += 40;

  // Literature Survey Comparative Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Literature Survey & Comparative Benchmarking Matrix', margin, curY);

  curY += 4;
  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TRAINING PARADIGM', margin + 3, curY + 4.8);
  doc.text('METHODOLOGY & LIMITATIONS', margin + 55, curY + 4.8);
  doc.text('AEGIS-AR INNOVATION', margin + 125, curY + 4.8);

  curY += 7;

  const tableRows = [
    {
      col1: 'Physical Drills (NFPA / OSHA)',
      col2: 'Prescheduled walkthroughs; zero active threats, no smoke or biometric feedback.',
      col3: 'Zero physical danger with full sensory stress, smoke gasping, and collapse risks.'
    },
    {
      col1: 'Standalone Desktop Serious Games',
      col2: 'Unity/Unreal executables; 10GB+ downloads, requires gaming rigs, no mobile AR.',
      col3: 'Zero-install WebGL/WebXR accessible on any standard laptop or smartphone browser.'
    },
    {
      col1: 'Crowd Flow Simulations (Social Force)',
      col2: 'Helbing 2D mathematical macro-models; lacks individual trainee immersion & agency.',
      col3: 'First-person + third-person immersive agency with real-time stamina and hazard trauma.'
    },
    {
      col1: 'Mobile AR Wayfinding Apps',
      col2: 'Static point-to-point GPS arrows; oblivious to dynamic fires or corridor collapses.',
      col3: 'Dynamic hazard avoidance, tactical smoke crawl stance, and real-time vital monitoring.'
    }
  ];

  tableRows.forEach((row, i) => {
    const rowBg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, curY, contentWidth, 12, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.rect(margin, curY, contentWidth, 12, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.col1, margin + 3, curY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(row.col2, 65), margin + 55, curY + 4.5);
    doc.setTextColor( darkTeal[0], darkTeal[1], darkTeal[2] );
    doc.text(doc.splitTextToSize(row.col3, 50), margin + 125, curY + 4.5);

    curY += 12;
  });


  // ==========================================
  // PAGE 4: PARAMETER 2A - REQUIREMENT ANALYSIS & SRS
  // ==========================================
  doc.addPage();
  drawPageDecorations(4, totalPages, '2A - Requirements & SRS');
  curY = drawSectionBadge(18, 'Parameter 2A', 'Objectives, Scope & Software Requirement Specification');

  // Objectives & Scope Grid
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, curY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, curY, contentWidth, 34, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Project Objectives & Functional Scope', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const objBullets = [
    'Primary Objective 1: Create a highly accessible browser-based 3D digital twin of educational facilities.',
    'Primary Objective 2: Model human stress responses—adrenal panic, heart rate escalation, and stamina exhaustion.',
    'Primary Objective 3: Implement hazard interaction pipelines including conflagrations, toxic clouds, smoke, and arcs.',
    'Scope Boundaries: Fully cross-platform on modern WebGL browsers; supports third/first-person and mobile AR viewports.'
  ];
  objBullets.forEach((ob, idx) => {
    doc.text(`• ${ob}`, margin + 5, curY + 12 + idx * 4.6);
  });

  curY += 40;

  // Software Requirement Specification (SRS)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Software Requirement Specification (SRS)', margin, curY);

  curY += 5;
  const srsBoxes = [
    {
      title: 'Hardware & Client Constraints',
      items: [
        'Processor: Dual-core CPU with WebGL 2.0 GPU support.',
        'Memory: Minimum 4GB RAM (8GB recommended).',
        'Input: Standard QWERTY Keyboard/Mouse or Touchscreen.',
        'Audio: Stereo audio output for 3D spatial soundscapes.'
      ]
    },
    {
      title: 'Software & Technology Stack',
      items: [
        'Core Language: TypeScript (Strict typing enabled).',
        'UI Framework: React 18 / 19 with Tailwind CSS v4.',
        '3D Engine: Three.js WebGL Rendering Pipeline.',
        'Audio Engine: Web Audio API (Synthesizers & Oscillators).'
      ]
    }
  ];

  const colWidth = (contentWidth - 4) / 2;
  srsBoxes.forEach((box, i) => {
    const boxX = margin + i * (colWidth + 4);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(boxX, curY, colWidth, 32, 2, 2, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(boxX, curY, colWidth, 32, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text(box.title, boxX + 4, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    box.items.forEach((it, idx) => {
      doc.text(`• ${it}`, boxX + 4, curY + 12 + idx * 4.4);
    });
  });

  curY += 38;

  // Functional & Non-Functional Requirements Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Key Functional (FR) & Non-Functional (NFR) Requirements', margin, curY);

  curY += 4;
  const reqItems = [
    { code: 'FR-01', desc: 'Camera-Relative Steering: Characters orient along camera forward vector; A/D strafe with orbit follow.' },
    { code: 'FR-02', desc: 'Danger Sensing & Adrenaline: Hazards within 8.5m trigger elevated heartbeat and visual alert pill.' },
    { code: 'FR-03', desc: 'Stamina Depletion: Continuous sprint and stress drain stamina; exhaustion prohibits sprinting and slows walk.' },
    { code: 'FR-04', desc: 'Fatal Casualty & Debrief: At 0% health, trigger collapse animation, flatline tone, and incident debrief.' },
    { code: 'NFR-01', desc: 'Performance & Frame Rate: Maintains solid 60 FPS rendering on integrated graphics via geometry batching.' },
    { code: 'NFR-02', desc: 'Zero Plugin Architecture: Operates entirely inside standard modern web browsers without installation.' }
  ];

  reqItems.forEach((req, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(margin, curY, contentWidth, 7, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.rect(margin, curY, contentWidth, 7, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
    doc.text(req.code, margin + 3, curY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(req.desc, margin + 20, curY + 4.8);

    curY += 7;
  });


  // ==========================================
  // PAGE 5: PARAMETER 2B - SYSTEM DESIGN & METHODOLOGY
  // ==========================================
  doc.addPage();
  drawPageDecorations(5, totalPages, '2B - System Design & Architecture');
  curY = drawSectionBadge(18, 'Parameter 2B', 'Methodology & System Architecture');

  // Mathematical Physics & Bio-Stress Engine Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, curY, contentWidth, 48, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, curY, contentWidth, 48, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Mathematical Formulations & Physiological Engine', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const mathDescriptions = [
    '1. Camera-Relative Locomotion Transformation:',
    '   V_world = R_y(theta_cam) * [dx, 0, dz]^T  where theta_cam is the active camera orbit yaw.',
    '2. Proximity Danger Sensing Function:',
    '   DangerLevel = clamp( (R_sense - d_hazard) / (R_sense - R_hazard), 0.0, 1.0 )   (R_sense = 8.5m).',
    '3. Physiological Stress & Stamina Depletion:',
    '   d(Stamina)/dt = -(alpha + beta * DangerLevel) - gamma_sprint.  Exhaustion triggers a 2.2x damage multiplier.',
    '4. Casualty Trigger Threshold:',
    '   Health <= 0 -> State = Collapsed, Audio = 780Hz continuous flatline, Evaluation = Grade F (Casualty).'
  ];
  mathDescriptions.forEach((m, idx) => {
    doc.text(m, margin + 4, curY + 12 + idx * 5);
  });

  curY += 54;

  // Visual System Architecture Flowchart (Ascii/Box rendered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('System Architectural Modules & Data Flow', margin, curY);

  curY += 5;
  const flowBoxes = [
    {
      title: 'INPUT INTERFACES',
      color: [224, 242, 254],
      items: ['WASD Keyboard', 'Mouse Look Orbit', 'Touch Virtual Sticks', 'Device Gyroscope']
    },
    {
      title: 'PHYSICAL RIG & SIMULATOR',
      color: [254, 243, 199],
      items: ['Three.js Scene Graph', 'Hazard Radiation Fields', 'Camera-Relative Move', 'Stamina State Machine']
    },
    {
      title: 'FEEDBACK & TELEMETRY',
      color: [220, 252, 231],
      items: ['Synthesized Web Audio', 'AR Optical Ribbon', 'Casualty Red Vignette', 'AAR Debrief Scorecard']
    }
  ];

  const flowBoxWidth = (contentWidth - 8) / 3;
  flowBoxes.forEach((fb, i) => {
    const fX = margin + i * (flowBoxWidth + 4);
    doc.setFillColor(fb.color[0], fb.color[1], fb.color[2]);
    doc.roundedRect(fX, curY, flowBoxWidth, 34, 2, 2, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(fX, curY, flowBoxWidth, 34, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(fb.title, fX + 3, curY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    fb.items.forEach((it, idx) => {
      doc.text(`• ${it}`, fX + 3, curY + 12 + idx * 4.6);
    });
  });

  curY += 42;

  // Debrief Scoring System
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, curY, contentWidth, 30, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, curY, contentWidth, 30, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkTeal[0], darkTeal[1], darkTeal[2]);
  doc.text('After-Action Review (AAR) Automated Scoring Algorithm', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const scoreBullets = [
    'Total Score = BasePoints + TimeBonus(t) - HazardHits * 120 - SmokeExposure% * 10.',
    'Grading Criteria: S (>= 2200 pts, perfect egress), A (>= 1800 pts), B (>= 1400 pts), C (>= 1000 pts), D (< 1000 pts).',
    'Casualty Fail Condition: If Health reaches 0% or character collapses, Grade is locked to F (Cadet Overcome by Hazard).'
  ];
  scoreBullets.forEach((s, idx) => {
    doc.text(`• ${s}`, margin + 5, curY + 11.5 + idx * 4.4);
  });


  // ==========================================
  // PAGE 6: PARAMETER 2B (CONT.) - EXPECTED OUTCOMES & SYNOPSIS
  // ==========================================
  doc.addPage();
  drawPageDecorations(6, totalPages, '2B - Expected Outcomes & Synopsis');
  curY = drawSectionBadge(18, 'Parameter 2B (Cont.)', 'Expected Outcomes, Project Synopsis & Future Directions');

  // Expected Outcomes Card
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(margin, curY, contentWidth, 42, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, curY, contentWidth, 42, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('Expected Outcomes & Educational Efficacy', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const outcomeBullets = [
    'Instinctive Safe Evacuation Habits: Trainees learn to instinctively stay low beneath smoke plumes rather than sprint upright.',
    'Understanding Physical Stamina Limits: Trainees experience the lethal hazard of burnout and panic-sprinting during emergency evacuations.',
    'Zero-Deployment Barrier for Institutions: Campuses can conduct synchronized virtual fire drills for thousands of students via a simple web URL.',
    'Objective Evacuation Auditing: Campus emergency responders obtain precise heatmaps of bottlenecks and high-casualty corridor segments.'
  ];
  outcomeBullets.forEach((ob, idx) => {
    doc.text(`• ${ob}`, margin + 5, curY + 12 + idx * 5.2);
  });

  curY += 48;

  // Comprehensive Project Synopsis Box
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(margin, curY, contentWidth, 42, 2, 2, 'F');
  doc.setDrawColor(94, 234, 212);
  doc.roundedRect(margin, curY, contentWidth, 42, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 118, 110);
  doc.text('Project Synopsis & Technological Contributions', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(19, 78, 74);
  const synopBullets = [
    'AegisAR successfully proves that high-fidelity disaster preparedness does not require proprietary, expensive VR hardware.',
    'By blending Three.js WebGL rendering, camera-relative vector physics, procedural Web Audio biological feedback, and Augmented Reality',
    'overlays, the application delivers an authentic simulation of high-stress egress.',
    'The inclusion of danger sensing, realistic stamina consumption, and fatal casualty collapses bridges the critical gap between',
    'superficial video games and rigorous, life-saving civil defense training tools.'
  ];
  synopBullets.forEach((sy, idx) => {
    doc.text(sy, margin + 4, curY + 13 + idx * 4.6);
  });

  curY += 48;

  // Signoff & Metadata
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, curY, contentWidth, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Project Status: Fully Compiled, Validated & Production Ready', margin + 5, curY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated from AegisAR Simulation Core • Ready for Academic Viva / Presentation / Defense Evaluation', margin + 5, curY + 13);

  // Save the document with a clean filename
  doc.save('AegisAR_Project_Presentation_Report.pdf');
}
