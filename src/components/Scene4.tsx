import { ANIMATION_CONSTANTS, SCENE_CONSTANTS, configureMeshVisibility, MODEL_PATH } from './Scene3D';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState, JSX } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Scene } from './Scene';
import { addCenterLight } from './Scene1';
import {
    Object3D,
    AnimationAction,
    Vector3,
} from "three";
import gsap from "gsap";
import { TimelineDescription } from './TimelineDescription';
import { ATCSpeedDisplay } from './SpeedDisplay';
