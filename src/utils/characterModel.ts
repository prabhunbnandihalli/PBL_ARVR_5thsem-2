import * as THREE from 'three';
import { CharacterCustomization } from '../types';

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee?: THREE.Group;
  rightKnee?: THREE.Group;
  flashlight?: THREE.SpotLight;
  updateAnimation: (
    time: number,
    speed: number,
    isCrouching: boolean,
    dangerLevel?: number,
    stamina?: number,
    isDead?: boolean
  ) => void;
}

/**
 * Creates an articulated hand with palm, opposable thumb, and 4 individual fingers
 * matching the anatomical humanoid silhouette in the reference image.
 */
function createArticulatedHand(material: THREE.Material, isLeft: boolean): THREE.Group {
  const handGroup = new THREE.Group();

  // 1. Palm base
  const palmGeo = new THREE.BoxGeometry(0.075, 0.032, 0.085);
  palmGeo.translate(0, -0.016, 0.038);
  const palm = new THREE.Mesh(palmGeo, material);
  palm.castShadow = true;
  handGroup.add(palm);

  // 2. Opposable Thumb
  const thumbBase = new THREE.Group();
  const thumbXSign = isLeft ? -1 : 1;
  thumbBase.position.set(thumbXSign * 0.038, -0.012, 0.022);
  thumbBase.rotation.y = thumbXSign * 0.55;
  thumbBase.rotation.x = 0.25;

  const thumbSeg1Geo = new THREE.CylinderGeometry(0.011, 0.012, 0.042, 8);
  thumbSeg1Geo.translate(0, 0, 0.021);
  thumbSeg1Geo.rotateX(Math.PI / 2);
  const thumbSeg1 = new THREE.Mesh(thumbSeg1Geo, material);
  thumbBase.add(thumbSeg1);

  const thumbTipGeo = new THREE.SphereGeometry(0.011, 8, 8);
  thumbTipGeo.translate(0, 0, 0.044);
  const thumbTip = new THREE.Mesh(thumbTipGeo, material);
  thumbBase.add(thumbTip);
  handGroup.add(thumbBase);

  // 3. Four Articulated Fingers (Index, Middle, Ring, Pinky)
  const fingerOffsets = [
    { x: -0.027, len: 0.052, rad: 0.0095 }, // Index
    { x: -0.009, len: 0.058, rad: 0.0100 }, // Middle
    { x: 0.009, len: 0.053, rad: 0.0095 },  // Ring
    { x: 0.027, len: 0.044, rad: 0.0085 },  // Pinky
  ];

  fingerOffsets.forEach((f, idx) => {
    const fingerGroup = new THREE.Group();
    // Slight natural splay angle
    const splayAngle = (idx - 1.5) * 0.08 * (isLeft ? -1 : 1);
    fingerGroup.position.set(f.x * (isLeft ? -1 : 1), -0.015, 0.08);
    fingerGroup.rotation.y = splayAngle;
    fingerGroup.rotation.x = 0.08; // Gentle natural curve

    const segGeo = new THREE.CylinderGeometry(f.rad * 0.9, f.rad, f.len, 8);
    segGeo.translate(0, 0, f.len / 2);
    segGeo.rotateX(Math.PI / 2);
    const seg = new THREE.Mesh(segGeo, material);
    fingerGroup.add(seg);

    const tipGeo = new THREE.SphereGeometry(f.rad * 0.9, 8, 8);
    tipGeo.translate(0, 0, f.len);
    const tip = new THREE.Mesh(tipGeo, material);
    fingerGroup.add(tip);

    handGroup.add(fingerGroup);
  });

  return handGroup;
}

export function createCharacterRig(customization: CharacterCustomization): CharacterRig {
  const root = new THREE.Group();
  root.name = 'player_character';

  // --- Realistic Color Palette & Materials ---
  const isTeacher = customization.role === 'Teacher';
  const isStudent = customization.role === 'Student';
  const isPaddedVest = customization.clothingStyle === 'padded_vest' || (!customization.clothingStyle && isStudent);

  // Skin tone
  const skinColor = customization.skinTone || '#f8d9b6';
  const skinMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skinColor),
    roughness: 0.52,
    metalness: 0.04,
  });

  // Hair material
  const hairColor = customization.hairColor || '#1e293b';
  const hairMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hairColor),
    roughness: 0.72,
    metalness: 0.1,
  });

  // Primary Outfit / Uniform Material
  // Default to olive green (#557a46 / #4d7c0f) like the reference image if padded vest, or collegiate blue
  let outfitHex = customization.clothingColor;
  if (!outfitHex || outfitHex === '#2563eb') {
    if (isPaddedVest) outfitHex = '#557a46'; // Olive drab green matching the reference image!
    else if (isTeacher) outfitHex = '#1e293b'; // Slate charcoal blazer
  }

  const outfitMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(outfitHex),
    roughness: 0.65,
    metalness: 0.12,
  });

  // Secondary Vest / Trim material
  const vestMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(outfitHex),
    roughness: 0.55,
    metalness: 0.08,
  });

  // Collared shirt / inner layer material
  const shirtMat = new THREE.MeshStandardMaterial({
    color: isTeacher ? 0xf1f5f9 : isStudent ? 0xf8fafc : 0xe2e8f0,
    roughness: 0.7,
  });

  // Trousers / Slacks material
  // In the image: brown/khaki uniform slacks!
  let pantsColor = 0x5c4033; // Warm brown matching reference photo
  if (customization.clothingStyle === 'teacher_suit' || isTeacher) {
    pantsColor = 0x334155; // Formal charcoal slacks
  } else if (customization.clothingStyle === 'student_uniform') {
    pantsColor = 0x1e293b; // Classic navy uniform slacks
  } else if (customization.clothingStyle === 'paramedic_suit') {
    pantsColor = 0x172554; // Paramedic navy
  }

  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColor,
    roughness: 0.75,
  });

  // Footwear material (Slate/dark with crisp white/light sole)
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate gray as in image
    roughness: 0.6,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Clean light sole
    roughness: 0.4,
  });

  // Tactical Glove material (Dark charcoal matching outstretched hands in reference image)
  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // Charcoal tactical gloves
    roughness: 0.6,
  });

  // Gold / Silver Metallic details
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.25,
  });

  // --- Pelvis & Hips ---
  const pelvis = new THREE.Group();
  pelvis.position.y = 0.88;
  root.add(pelvis);

  // Pelvic core
  const pelvisGeo = new THREE.CylinderGeometry(0.19, 0.16, 0.18, 16);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvisMesh.castShadow = true;
  pelvis.add(pelvisMesh);

  // Uniform Belt with metallic buckle
  const beltGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.045, 16);
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = 0.07;
  pelvis.add(belt);

  const buckleGeo = new THREE.BoxGeometry(0.065, 0.05, 0.015);
  const buckle = new THREE.Mesh(buckleGeo, metalMat);
  buckle.position.set(0, 0.07, 0.2);
  pelvis.add(buckle);

  // --- Torso Assembly (Realistic Segmented Vest / Uniform Jacket) ---
  const torso = new THREE.Group();
  torso.position.y = 0.09;
  pelvis.add(torso);

  // Cylindrical Neck
  const neckGeo = new THREE.CylinderGeometry(0.068, 0.075, 0.16, 16);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(0, 0.62, 0);
  neck.castShadow = true;
  torso.add(neck);

  // Inner Shirt / Chest Core
  const chestCoreGeo = new THREE.BoxGeometry(0.38, 0.58, 0.24);
  chestCoreGeo.translate(0, 0.32, 0);
  const chestCore = new THREE.Mesh(chestCoreGeo, shirtMat);
  torso.add(chestCore);

  // Deltoid Shoulder Caps (Left & Right rounded shoulder pads bridging chest and arms)
  const deltoidGeo = new THREE.SphereGeometry(0.088, 14, 12);
  deltoidGeo.scale(1.15, 0.9, 1.15);

  const leftDeltoid = new THREE.Mesh(deltoidGeo, vestMat);
  leftDeltoid.position.set(-0.24, 0.52, 0);
  leftDeltoid.castShadow = true;
  torso.add(leftDeltoid);

  const rightDeltoid = new THREE.Mesh(deltoidGeo, vestMat);
  rightDeltoid.position.set(0.24, 0.52, 0);
  rightDeltoid.castShadow = true;
  torso.add(rightDeltoid);

  // 4 Segmented Horizontal Padded Cushions / Ribs (Iconic puffer vest anatomy from photo)
  // Segment 1: Upper Pectorals / Chest (wider, collar frame)
  const rib1Geo = new THREE.BoxGeometry(0.44, 0.15, 0.29);
  const rib1 = new THREE.Mesh(rib1Geo, vestMat);
  rib1.position.set(0, 0.50, 0.015);
  rib1.castShadow = true;
  torso.add(rib1);

  // Segment 2: Ribcage / Midsection
  const rib2Geo = new THREE.BoxGeometry(0.41, 0.13, 0.27);
  const rib2 = new THREE.Mesh(rib2Geo, vestMat);
  rib2.position.set(0, 0.36, 0.01);
  rib2.castShadow = true;
  torso.add(rib2);

  // Segment 3: Abdomen
  const rib3Geo = new THREE.BoxGeometry(0.38, 0.13, 0.25);
  const rib3 = new THREE.Mesh(rib3Geo, vestMat);
  rib3.position.set(0, 0.23, 0.005);
  rib3.castShadow = true;
  torso.add(rib3);

  // Segment 4: Waist Hem / Taper
  const rib4Geo = new THREE.BoxGeometry(0.40, 0.12, 0.26);
  const rib4 = new THREE.Mesh(rib4Geo, vestMat);
  rib4.position.set(0, 0.10, 0.0);
  rib4.castShadow = true;
  torso.add(rib4);

  // Uniform Specific Decals & Embellishments:
  if (isTeacher || customization.clothingStyle === 'teacher_suit') {
    // Formal Teacher Blazer Lapels
    const lapelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const lapelGeo = new THREE.BoxGeometry(0.07, 0.38, 0.04);

    const leftLapel = new THREE.Mesh(lapelGeo, lapelMat);
    leftLapel.position.set(-0.11, 0.44, 0.16);
    leftLapel.rotation.z = -0.18;
    torso.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, lapelMat);
    rightLapel.position.set(0.11, 0.44, 0.16);
    rightLapel.rotation.z = 0.18;
    torso.add(rightLapel);

    // Teacher Silk Necktie
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35 });
    const tieGeo = new THREE.BoxGeometry(0.045, 0.28, 0.02);
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.42, 0.165);
    torso.add(tie);

    // Faculty ID Card Lanyard hanging around neck
    const lanyardMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const lanyardGeo = new THREE.TorusGeometry(0.09, 0.007, 6, 16, Math.PI);
    const lanyard = new THREE.Mesh(lanyardGeo, lanyardMat);
    lanyard.position.set(0, 0.56, 0.12);
    lanyard.rotation.x = Math.PI * 0.45;
    torso.add(lanyard);

    // Faculty Badge
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const badgeGeo = new THREE.BoxGeometry(0.065, 0.09, 0.01);
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.06, 0.36, 0.175);
    torso.add(badge);

    const photoMat = new THREE.MeshBasicMaterial({ color: 0x0369a1 });
    const photo = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.005), photoMat);
    photo.position.set(0.06, 0.38, 0.182);
    torso.add(photo);
  } else if (customization.clothingStyle === 'student_uniform') {
    // School Uniform Tie & Collar
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.02), tieMat);
    tie.position.set(0, 0.44, 0.16);
    torso.add(tie);

    // School Crest Badge on left chest
    const crestMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 12), crestMat);
    crest.position.set(-0.13, 0.48, 0.16);
    crest.rotation.x = Math.PI / 2;
    torso.add(crest);
  } else if (customization.clothingStyle === 'lab_coat') {
    // White science lab coat panels
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const coatFront = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.65, 0.31), coatMat);
    coatFront.position.set(0, 0.32, 0);
    coatFront.castShadow = true;
    torso.add(coatFront);
  } else if (customization.clothingStyle === 'warden_uniform') {
    // High-vis reflective stripes
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x4d7c0f,
      emissiveIntensity: 0.45,
      roughness: 0.25,
    });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.31), stripeMat);
    stripe.position.set(0, 0.36, 0);
    torso.add(stripe);
  }

  // Body Equipment (High-Vis Vest, Hazmat Suit, etc.)
  if (customization.equipment.vest === 'high_vis_vest') {
    const vestGeo = new THREE.BoxGeometry(0.48, 0.54, 0.33);
    const hiVisMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x4d7c0f,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });
    const bodyVest = new THREE.Mesh(vestGeo, hiVisMat);
    bodyVest.position.set(0, 0.34, 0);
    torso.add(bodyVest);

    const refBandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.9 });
    const refBand = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.05, 0.34), refBandMat);
    refBand.position.set(0, 0.34, 0);
    torso.add(refBand);
  } else if (customization.equipment.vest === 'hazard_suit') {
    const hazmatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const hazmatVest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.56, 0.33), hazmatMat);
    hazmatVest.position.set(0, 0.34, 0);
    torso.add(hazmatVest);
  }

  // Backpack Equipment
  if (customization.equipment.backpack === 'fire_extinguisher') {
    const tankGroup = new THREE.Group();
    tankGroup.position.set(0, 0.36, -0.22);

    const cylinderGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.44, 16);
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.4 });
    const tank = new THREE.Mesh(cylinderGeo, redMat);
    tankGroup.add(tank);

    const valveGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.09, 8);
    const valve = new THREE.Mesh(valveGeo, metalMat);
    valve.position.y = 0.25;
    tankGroup.add(valve);

    torso.add(tankGroup);
  } else if (customization.equipment.backpack === 'first_aid_kit') {
    const bagGeo = new THREE.BoxGeometry(0.32, 0.36, 0.16);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(0, 0.34, -0.21);

    const crossHGeo = new THREE.BoxGeometry(0.14, 0.04, 0.015);
    const crossVGeo = new THREE.BoxGeometry(0.04, 0.14, 0.015);
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ch = new THREE.Mesh(crossHGeo, whiteMat);
    const cv = new THREE.Mesh(crossVGeo, whiteMat);
    ch.position.set(0, 0, -0.09);
    cv.position.set(0, 0, -0.09);
    bag.add(ch, cv);

    torso.add(bag);
  }

  // --- Head Group ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.70, 0); // Positioned naturally on the neck
  torso.add(headGroup);

  // Anatomical Head (Egg-shaped cranium with chin & jawline taper)
  const headGeo = new THREE.SphereGeometry(0.175, 24, 20);
  headGeo.scale(0.96, 1.14, 1.05); // Realistic human facial proportions
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Subtle jaw/chin definition
  const chinGeo = new THREE.SphereGeometry(0.065, 12, 10);
  chinGeo.scale(1.0, 0.75, 1.0);
  const chin = new THREE.Mesh(chinGeo, skinMat);
  chin.position.set(0, -0.12, 0.08);
  headGroup.add(chin);

  // Realistic Ears
  const earGeo = new THREE.SphereGeometry(0.042, 10, 10);
  earGeo.scale(0.35, 1.0, 0.65);
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.position.set(-0.17, 0.01, 0);
  leftEar.rotation.y = -0.2;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMat);
  rightEar.position.set(0.17, 0.01, 0);
  rightEar.rotation.y = 0.2;
  headGroup.add(rightEar);

  // --- Expressive Facial Features ---
  const faceGroup = new THREE.Group();

  // Eyes (Sclera + Iris + Pupil + Catchlight)
  const scleraGeo = new THREE.SphereGeometry(0.034, 12, 10);
  scleraGeo.scale(1.0, 1.1, 0.35);
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const irisColor = isTeacher ? 0x0284c7 : 0x1e3a8a;
  const irisGeo = new THREE.SphereGeometry(0.022, 10, 8);
  irisGeo.scale(1.0, 1.0, 0.3);
  const irisMat = new THREE.MeshBasicMaterial({ color: irisColor });

  const pupilGeo = new THREE.SphereGeometry(0.013, 8, 8);
  pupilGeo.scale(1.0, 1.0, 0.3);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

  const catchlightGeo = new THREE.SphereGeometry(0.006, 6, 6);
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Left Eye
  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-0.062, 0.025, 0.165);
  const leftSclera = new THREE.Mesh(scleraGeo, scleraMat);
  const leftIris = new THREE.Mesh(irisGeo, irisMat);
  leftIris.position.z = 0.008;
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.z = 0.012;
  const leftCatchlight = new THREE.Mesh(catchlightGeo, catchlightMat);
  leftCatchlight.position.set(0.007, 0.007, 0.014);
  leftEyeGroup.add(leftSclera, leftIris, leftPupil, leftCatchlight);
  faceGroup.add(leftEyeGroup);

  // Right Eye
  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(0.062, 0.025, 0.165);
  const rightSclera = new THREE.Mesh(scleraGeo, scleraMat);
  const rightIris = new THREE.Mesh(irisGeo, irisMat);
  rightIris.position.z = 0.008;
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.z = 0.012;
  const rightCatchlight = new THREE.Mesh(catchlightGeo, catchlightMat);
  rightCatchlight.position.set(0.007, 0.007, 0.014);
  rightEyeGroup.add(rightSclera, rightIris, rightPupil, rightCatchlight);
  faceGroup.add(rightEyeGroup);

  // Eyebrows
  const browGeo = new THREE.BoxGeometry(0.052, 0.012, 0.018);
  const browMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hairColor), roughness: 0.8 });

  const leftBrow = new THREE.Mesh(browGeo, browMat);
  leftBrow.position.set(-0.062, 0.072, 0.168);
  leftBrow.rotation.z = -0.10;
  faceGroup.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, browMat);
  rightBrow.position.set(0.062, 0.072, 0.168);
  rightBrow.rotation.z = 0.10;
  faceGroup.add(rightBrow);

  // Anatomical Nose bridge & tip
  const noseBridgeGeo = new THREE.BoxGeometry(0.024, 0.052, 0.035);
  noseBridgeGeo.translate(0, 0, 0.015);
  const noseTipGeo = new THREE.SphereGeometry(0.018, 8, 8);
  noseTipGeo.scale(1.0, 0.85, 1.0);
  const noseTip = new THREE.Mesh(noseTipGeo, skinMat);
  noseTip.position.set(0, -0.02, 0.182);

  const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMat);
  noseBridge.position.set(0, 0.005, 0.165);
  faceGroup.add(noseBridge, noseTip);

  // Natural Mouth
  const mouthGeo = new THREE.TorusGeometry(0.030, 0.006, 6, 12, Math.PI * 0.7);
  mouthGeo.rotateZ(-Math.PI * 0.85);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.062, 0.168);
  faceGroup.add(mouth);

  // Spectacles / Glasses (Ideal for Teacher or studious Student!)
  const showGlasses = customization.hasGlasses || isTeacher;
  if (showGlasses) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.2 });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.8,
    });

    const glassFrameGeo = new THREE.TorusGeometry(0.036, 0.0045, 6, 16);
    const leftFrame = new THREE.Mesh(glassFrameGeo, frameMat);
    leftFrame.position.set(-0.062, 0.025, 0.185);

    const rightFrame = new THREE.Mesh(glassFrameGeo, frameMat);
    rightFrame.position.set(0.062, 0.025, 0.185);

    const bridgeBar = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.005, 0.005), frameMat);
    bridgeBar.position.set(0, 0.03, 0.185);

    const lensGeo = new THREE.CircleGeometry(0.034, 16);
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.set(-0.062, 0.025, 0.185);
    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.set(0.062, 0.025, 0.185);

    faceGroup.add(leftFrame, rightFrame, bridgeBar, leftLens, rightLens);
  }

  headGroup.add(faceGroup);

  // --- Hair Styling (Stylish Layered Quiff, Parted Teacher, Sporty, Pony, etc.) ---
  const hairGroup = new THREE.Group();
  const hairStyle = customization.hairStyle || (isTeacher ? 'parted' : 'stylish');

  if (hairStyle === 'stylish') {
    // Modern Layered Stylish Hair (Textured top with side volume and bangs)
    const baseCapGeo = new THREE.SphereGeometry(0.185, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const baseCap = new THREE.Mesh(baseCapGeo, hairMat);
    baseCap.position.y = 0.025;
    hairGroup.add(baseCap);

    // Textured stylish quiff top puffs
    const quiffGeo1 = new THREE.SphereGeometry(0.095, 10, 8);
    quiffGeo1.scale(1.1, 0.8, 1.4);
    const quiff1 = new THREE.Mesh(quiffGeo1, hairMat);
    quiff1.position.set(0, 0.16, 0.04);
    quiff1.rotation.x = -0.18;
    hairGroup.add(quiff1);

    // Stylish front fringe / swept bangs
    const fringeGeo = new THREE.ConeGeometry(0.06, 0.12, 6);
    fringeGeo.rotateX(-Math.PI * 0.6);
    fringeGeo.rotateZ(0.2);
    const fringe = new THREE.Mesh(fringeGeo, hairMat);
    fringe.position.set(-0.04, 0.14, 0.15);
    hairGroup.add(fringe);

    const sideburnGeo = new THREE.BoxGeometry(0.025, 0.08, 0.04);
    const leftBurn = new THREE.Mesh(sideburnGeo, hairMat);
    leftBurn.position.set(-0.175, 0.02, 0.06);
    const rightBurn = new THREE.Mesh(sideburnGeo, hairMat);
    rightBurn.position.set(0.175, 0.02, 0.06);
    hairGroup.add(leftBurn, rightBurn);
  } else if (hairStyle === 'parted') {
    // Professional Teacher / Scholar Side-Parted Hair
    const partedGeo = new THREE.SphereGeometry(0.186, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56);
    const partedMesh = new THREE.Mesh(partedGeo, hairMat);
    partedMesh.position.y = 0.025;
    partedMesh.rotation.z = -0.08;
    hairGroup.add(partedMesh);

    const topPartGeo = new THREE.BoxGeometry(0.18, 0.045, 0.22);
    const topPart = new THREE.Mesh(topPartGeo, hairMat);
    topPart.position.set(0.02, 0.17, -0.01);
    topPart.rotation.z = -0.12;
    hairGroup.add(topPart);
  } else if (hairStyle === 'ponytail') {
    const baseCapGeo = new THREE.SphereGeometry(0.185, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const baseCap = new THREE.Mesh(baseCapGeo, hairMat);
    baseCap.position.y = 0.02;
    hairGroup.add(baseCap);

    const ponyGeo = new THREE.CylinderGeometry(0.038, 0.075, 0.28, 10);
    const pony = new THREE.Mesh(ponyGeo, hairMat);
    pony.position.set(0, 0.05, -0.23);
    pony.rotation.x = -Math.PI / 3.8;
    hairGroup.add(pony);

    // Hair tie band
    const tieBandMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4 });
    const tieBand = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12), tieBandMat);
    tieBand.position.set(0, 0.09, -0.19);
    hairGroup.add(tieBand);
  } else if (hairStyle === 'curly') {
    const curlyCap = new THREE.SphereGeometry(0.188, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
    hairGroup.add(new THREE.Mesh(curlyCap, hairMat));

    // Volumetric curls cluster
    for (let c = 0; c < 7; c++) {
      const curlNode = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), hairMat);
      const angle = (c / 7) * Math.PI * 2;
      curlNode.position.set(Math.cos(angle) * 0.11, 0.15 + (c % 2) * 0.02, Math.sin(angle) * 0.11);
      hairGroup.add(curlNode);
    }
  } else {
    // Clean Short / Buzz Cut
    const buzzGeo = new THREE.SphereGeometry(0.182, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54);
    const buzz = new THREE.Mesh(buzzGeo, hairMat);
    buzz.position.y = 0.025;
    hairGroup.add(buzz);
  }

  headGroup.add(hairGroup);

  // Headgear Equipment (Safety Helmet, Gas Mask, Smoke Hood)
  if (customization.equipment.headgear === 'safety_helmet') {
    const helmetGeo = new THREE.SphereGeometry(0.22, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.2 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.06;

    const brimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 18);
    const brim = new THREE.Mesh(brimGeo, helmetMat);
    brim.position.y = 0.05;
    helmet.add(brim);

    // Integrated Tactical Headlamp
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.05, 0.045),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.9 })
    );
    lamp.position.set(0, 0.11, 0.21);
    helmet.add(lamp);

    headGroup.add(helmet);
  } else if (customization.equipment.headgear === 'gas_mask') {
    const maskGeo = new THREE.BoxGeometry(0.17, 0.14, 0.14);
    const maskMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const mask = new THREE.Mesh(maskGeo, maskMat);
    mask.position.set(0, -0.05, 0.14);

    const canisterGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.11, 12);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.7 });
    const can = new THREE.Mesh(canisterGeo, canMat);
    can.rotation.x = Math.PI / 2;
    can.position.set(0, -0.05, 0.12);
    mask.add(can);

    headGroup.add(mask);
  } else if (customization.equipment.headgear === 'smoke_hood') {
    const hoodGeo = new THREE.SphereGeometry(0.23, 16, 12);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.3,
      transparent: true,
      opacity: 0.88,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.y = 0.04;
    headGroup.add(hood);
  }

  // --- Articulated Arms (Matching Reference Image: Deltoids, Biceps, Elbows, Forearms & Outstretched Hands) ---
  const armSleeveMat = isPaddedVest ? skinMat : outfitMat; // Sleeveless padded vest shows arms like reference image!

  // Helper to build full arm assembly with articulated hand
  const buildArm = (isLeft: boolean) => {
    const armRoot = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    armRoot.position.set(sign * 0.28, 0.54, 0);

    // Shoulder sphere joint
    const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), armSleeveMat);
    armRoot.add(shoulderJoint);

    // Upper Arm (Bicep/Tricep)
    const upperArmGeo = new THREE.CylinderGeometry(0.050, 0.046, 0.26, 12);
    upperArmGeo.translate(0, -0.13, 0);
    const upperArm = new THREE.Mesh(upperArmGeo, armSleeveMat);
    upperArm.castShadow = true;
    armRoot.add(upperArm);

    // Elbow Sphere Joint
    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 10), skinMat);
    elbowJoint.position.set(0, -0.27, 0);
    armRoot.add(elbowJoint);

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.044, 0.038, 0.25, 12);
    forearmGeo.translate(0, -0.125, 0);
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.set(0, -0.27, 0);
    forearm.castShadow = true;
    armRoot.add(forearm);

    // Wrist cuff
    const cuffGeo = new THREE.CylinderGeometry(0.040, 0.040, 0.025, 12);
    const cuff = new THREE.Mesh(cuffGeo, gloveMat);
    cuff.position.set(0, -0.525, 0);
    armRoot.add(cuff);

    // Articulated Hand with outstretched fingers and thumb (as in reference image)
    const hand = createArticulatedHand(gloveMat, isLeft);
    hand.position.set(0, -0.53, 0);
    hand.rotation.x = Math.PI / 2; // Natural resting forward orientation
    armRoot.add(hand);

    return armRoot;
  };

  const leftArm = buildArm(true);
  torso.add(leftArm);

  const rightArm = buildArm(false);
  torso.add(rightArm);

  // Flashlight / Tactical Hand Tool
  let spotLight: THREE.SpotLight | undefined;
  if (customization.equipment.tool === 'flashlight' || customization.equipment.tool === 'thermal_camera') {
    const torchGeo = new THREE.CylinderGeometry(0.028, 0.036, 0.22, 10);
    const torch = new THREE.Mesh(torchGeo, metalMat);
    torch.rotation.x = Math.PI / 2;
    torch.position.set(0, -0.52, 0.16);
    rightArm.add(torch);

    spotLight = new THREE.SpotLight(0xfffbeb, 4.5, 28, Math.PI / 4.5, 0.35, 1);
    spotLight.position.set(0, -0.52, 0.26);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, -0.52, 10);
    rightArm.add(targetObj);
    spotLight.target = targetObj;
    rightArm.add(spotLight);
  }

  // --- Articulated Legs & Shoes (Matching Reference Image: Thighs, Knee Spheres, Calves, Ankle & Shoes) ---
  const buildLeg = (isLeft: boolean) => {
    const legRoot = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    legRoot.position.set(sign * 0.13, -0.06, 0);

    // Hip sphere joint
    const hipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), pantsMat);
    legRoot.add(hipJoint);

    // Upper Thigh (Muscular anatomical taper)
    const thighGeo = new THREE.CylinderGeometry(0.074, 0.060, 0.36, 12);
    thighGeo.translate(0, -0.18, 0);
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.castShadow = true;
    legRoot.add(thigh);

    // Knee Sphere Joint
    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), pantsMat);
    kneeJoint.position.set(0, -0.37, 0);
    legRoot.add(kneeJoint);

    // Lower Leg (Calf & Shin taper)
    const calfGeo = new THREE.CylinderGeometry(0.058, 0.046, 0.36, 12);
    calfGeo.translate(0, -0.18, 0);
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.position.set(0, -0.37, 0);
    calf.castShadow = true;
    legRoot.add(calf);

    // Ankle Sphere Joint
    const ankleJoint = new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 8), shoeMat);
    ankleJoint.position.set(0, -0.73, 0);
    legRoot.add(ankleJoint);

    // Detailed Shoe Assembly (Contoured body + White/Gray Outsole Rubber)
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.74, 0.06);

    // Rubber Outsole
    const soleGeo = new THREE.BoxGeometry(0.11, 0.028, 0.23);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, -0.014, 0);
    footGroup.add(sole);

    // Upper Shoe Body
    const shoeUpperGeo = new THREE.BoxGeometry(0.10, 0.065, 0.21);
    shoeUpperGeo.translate(0, 0.03, 0);
    const shoeUpper = new THREE.Mesh(shoeUpperGeo, shoeMat);
    shoeUpper.castShadow = true;
    footGroup.add(shoeUpper);

    // Toe Cap
    const toeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8);
    toeGeo.rotateX(Math.PI / 2);
    const toe = new THREE.Mesh(toeGeo, shoeMat);
    toe.position.set(0, 0.02, 0.09);
    footGroup.add(toe);

    legRoot.add(footGroup);
    return legRoot;
  };

  const leftLeg = buildLeg(true);
  pelvis.add(leftLeg);

  const rightLeg = buildLeg(false);
  pelvis.add(rightLeg);

  // --- Animation Controller (Realistic human kinetics, walking cadence, exhaustion, and casualty collapse) ---
  const updateAnimation = (
    time: number,
    speed: number,
    isCrouching: boolean,
    dangerLevel: number = 0,
    stamina: number = 100,
    isDead: boolean = false
  ) => {
    // 1. CASUALTY COLLAPSE (DEATH OVERRIDE)
    if (isDead) {
      pelvis.position.y = THREE.MathUtils.lerp(pelvis.position.y, 0.14, 0.12);
      pelvis.position.x = THREE.MathUtils.lerp(pelvis.position.x, 0, 0.1);
      pelvis.rotation.z = THREE.MathUtils.lerp(pelvis.rotation.z, 0.35, 0.12);
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, -1.35, 0.12);
      torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, 0.25, 0.12);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, -0.45, 0.12);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.65, 0.12);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -1.4, 0.12);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.7, 0.12);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.0, 0.12);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.8, 0.12);
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0.35, 0.12);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -0.2, 0.12);
      leftEyeGroup.scale.set(0.6, 0.15, 1);
      rightEyeGroup.scale.set(0.6, 0.15, 1);
      mouth.scale.set(1.2, 0.4, 1);
      return;
    }

    const safeDanger = Math.max(0, Math.min(1, dangerLevel));
    const staminaRatio = Math.max(0, Math.min(1, stamina / 100));

    // 2. CROUCH / STAND BASE POSTURE
    const basePelvisY = isCrouching ? 0.58 : 0.88;
    if (isCrouching) {
      pelvis.position.y = basePelvisY;
      torso.rotation.x = 0.35 + safeDanger * 0.1;
      headGroup.rotation.x = -0.25;
    } else {
      pelvis.position.y = basePelvisY;
      torso.rotation.x = safeDanger * 0.12;
      headGroup.rotation.x = (1 - staminaRatio) * 0.20; // Drooping head under fatigue
    }

    // 3. DANGER SENSING & ADRENALINE REACTION
    if (safeDanger > 0.05) {
      const lookJitter = Math.sin(time * 5.2) * 0.20 * safeDanger;
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, lookJitter, 0.2);

      const eyeScale = 1 + safeDanger * 0.35;
      leftEyeGroup.scale.set(eyeScale, eyeScale, 1);
      rightEyeGroup.scale.set(eyeScale, eyeScale, 1);

      leftBrow.position.y = 0.072 + safeDanger * 0.015;
      leftBrow.rotation.z = -0.10 - safeDanger * 0.25;
      rightBrow.position.y = 0.072 + safeDanger * 0.015;
      rightBrow.rotation.z = 0.10 + safeDanger * 0.25;

      mouth.rotation.x = safeDanger * 0.45;
      mouth.scale.set(1 + safeDanger * 0.3, 1 + safeDanger * 0.65, 1);
      pelvis.position.x = Math.sin(time * 26) * 0.008 * safeDanger;
    } else {
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0, 0.1);
      leftEyeGroup.scale.set(1, 1, 1);
      rightEyeGroup.scale.set(1, 1, 1);
      leftBrow.position.y = 0.072;
      leftBrow.rotation.z = -0.10;
      rightBrow.position.y = 0.072;
      rightBrow.rotation.z = 0.10;
      mouth.rotation.x = 0;
      mouth.scale.set(1, 1, 1);
      pelvis.position.x = 0;
    }

    // 4. LOW STAMINA BREATHING & FATIGUE
    if (staminaRatio < 0.35) {
      const breath = Math.sin(time * 7) * 0.032 * (1 - staminaRatio);
      torso.scale.set(1 + breath, 1, 1 + breath * 1.2);
    } else {
      torso.scale.set(1, 1, 1);
    }

    // 5. NATURAL GAIT & LOCOMOTION KINETICS
    if (speed > 0.05) {
      const fatigueFactor = staminaRatio < 0.25 ? 0.8 : 1.0;
      const cadence = (isCrouching ? 2.8 : Math.min(5.2, 3.2 + speed * 0.5)) * fatigueFactor;
      const walkCycle = time * cadence;

      // Leg stride angles
      const legAngleRange = (isCrouching ? 0.22 : (speed > 3.8 ? 0.40 : 0.30)) * fatigueFactor;
      const legAngle = Math.sin(walkCycle) * legAngleRange;
      leftLeg.rotation.x = legAngle;
      rightLeg.rotation.x = -legAngle;

      // Natural vertical foot clearance
      leftLeg.position.y = -0.06 + Math.max(0, -Math.sin(walkCycle)) * 0.028;
      rightLeg.position.y = -0.06 + Math.max(0, Math.sin(walkCycle)) * 0.028;

      // Arm swing in counter-phase with legs
      if (safeDanger > 0.4 && staminaRatio < 0.25) {
        // One hand clutching chest in exhaustion
        leftArm.rotation.x = -1.15;
        leftArm.rotation.z = 0.45;
        rightArm.rotation.x = -0.55 + Math.sin(walkCycle) * 0.15;
      } else if (safeDanger > 0.3) {
        // Raised protective tactical guard
        const armAngle = Math.sin(walkCycle) * 0.15;
        leftArm.rotation.x = -0.45 - armAngle;
        rightArm.rotation.x = -0.45 + armAngle;
      } else {
        const armAngle = Math.sin(walkCycle) * (isCrouching ? 0.14 : 0.32);
        leftArm.rotation.x = -armAngle;
        rightArm.rotation.x = armAngle;
      }

      // Torso natural vertical bobbing and pelvic sway
      pelvis.position.y = basePelvisY + Math.abs(Math.sin(walkCycle)) * 0.022;
      torso.rotation.z = Math.sin(walkCycle) * 0.015;
      torso.rotation.y = -Math.sin(walkCycle) * 0.04;
    } else {
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.2);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.2);
      leftLeg.position.y = THREE.MathUtils.lerp(leftLeg.position.y, -0.06, 0.2);
      rightLeg.position.y = THREE.MathUtils.lerp(rightLeg.position.y, -0.06, 0.2);

      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.2);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.2);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0, 0.2);
      torso.rotation.z = THREE.MathUtils.lerp(torso.rotation.z, 0, 0.2);
      torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, 0, 0.2);
    }
  };

  return {
    root,
    head: headGroup,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    flashlight: spotLight,
    updateAnimation,
  };
}
