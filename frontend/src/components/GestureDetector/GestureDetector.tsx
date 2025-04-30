import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import Webcam from 'react-webcam';
import './GestureDetector.css';

export type Gesture = 'thumbsUp' | 'thumbsDown' | 'flatHand' | null;

interface GestureDetectorProps {
    onGestureDetected: (gesture: Gesture) => void;
    isActive: boolean;
}

const GestureDetector: React.FC<GestureDetectorProps> = ({ onGestureDetected, isActive }) => {
    const webcamRef = useRef<Webcam>(null);
    const modelRef = useRef<handpose.HandPose | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const [detectedGesture, setDetectedGesture] = useState<Gesture>(null);
    const [holdProgress, setHoldProgress] = useState<number>(0);
    const [isHolding, setIsHolding] = useState<boolean>(false);
    const holdStartTimeRef = useRef<number>(0);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const gestureTriggeredRef = useRef<boolean>(false);

    useEffect(() => {
        if (!isActive) {
            resetGestureDetection();
            gestureTriggeredRef.current = false;
        }
    }, [isActive]);

    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                modelRef.current = await handpose.load();
                setIsModelLoaded(true);
                setDebugInfo('Handpose model loaded successfully');
            } catch (error) {
                setDebugInfo(`Error loading model: ${error}`);
                console.error('Error loading handpose model:', error);
            }
        };

        loadModel();
        return () => tf.dispose();
    }, []);

    useEffect(() => {
        if (!isActive || !isModelLoaded || !webcamRef.current) {
            return;
        }

        let lastFrameTime = 0;
        const FRAME_RATE = 100;

        const detect = async () => {
            const now = Date.now();

            if (now - lastFrameTime < FRAME_RATE) {
                animationFrameRef.current = requestAnimationFrame(detect);
                return;
            }

            lastFrameTime = now;

            if (webcamRef.current?.video?.readyState !== 4) {
                animationFrameRef.current = requestAnimationFrame(detect);
                return;
            }

            try {
                const model = modelRef.current;
                if (!model) return;

                const predictions = await model.estimateHands(webcamRef.current.video);

                if (predictions && predictions.length > 0) {
                    const gesture = detectGesture(predictions[0]);
                    handleGestureDetection(gesture);
                    const thumbInfo = isThumbUp(predictions[0].landmarks) ? "UP" :
                        isThumbDown(predictions[0].landmarks) ? "DOWN" : "NEUTRAL";
                    setDebugInfo(`Hand detected. Thumb: ${thumbInfo}. Gesture: ${gesture || 'None'}`);
                } else {
                    resetGestureDetection();
                    setDebugInfo('No hands detected');
                }
            } catch (error) {
                console.error('Error detecting hands:', error);
                setDebugInfo(`Error detecting hands: ${error}`);
            }

            animationFrameRef.current = requestAnimationFrame(detect);
        };

        detect();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isActive, isModelLoaded]);

    const isThumbUp = (landmarks: number[][]): boolean => {
        const wrist = landmarks[0];
        const thumb_tip = landmarks[4];
        const index_mcp = landmarks[5];

        return (thumb_tip[1] < wrist[1]) &&
            (Math.abs(thumb_tip[0] - index_mcp[0]) > 30);
    };

    const isThumbDown = (landmarks: number[][]): boolean => {
        const wrist = landmarks[0];
        const thumb_tip = landmarks[4];
        const index_mcp = landmarks[5];

        return (thumb_tip[1] > wrist[1]) &&
            (Math.abs(thumb_tip[0] - index_mcp[0]) > 30);
    };

    const areFingersExtended = (landmarks: number[][]): boolean => {
        const fingerTips = [8, 12, 16, 20];
        const fingerMCPs = [5, 9, 13, 17];

        let extendedCount = 0;
        for (let i = 0; i < fingerTips.length; i++) {
            if (landmarks[fingerTips[i]][1] < landmarks[fingerMCPs[i]][1]) {
                extendedCount++;
            }
        }

        return extendedCount >= 3;
    };

    const detectGesture = (prediction: handpose.AnnotatedPrediction): Gesture => {
        const landmarks = prediction.landmarks;

        if (isThumbUp(landmarks) && !areFingersExtended(landmarks)) {
            return 'thumbsUp';
        }

        if (isThumbDown(landmarks) && !areFingersExtended(landmarks)) {
            return 'thumbsDown';
        }

        if (areFingersExtended(landmarks)) {
            return 'flatHand';
        }

        return null;
    };

    const handleGestureDetection = (gesture: Gesture) => {
        if (!isActive || gestureTriggeredRef.current) {
            return;
        }

        if (gesture !== detectedGesture) {
            setDetectedGesture(gesture);
            setIsHolding(false);
            setHoldProgress(0);
            holdStartTimeRef.current = 0;
            return;
        }

        if (gesture === null) {
            return;
        }

        if (!isHolding) {
            setIsHolding(true);
            holdStartTimeRef.current = Date.now();
        }

        const holdTime = Date.now() - holdStartTimeRef.current;
        const progress = Math.min(holdTime / 3000, 1);
        setHoldProgress(progress);

        if (holdTime >= 3000 && !gestureTriggeredRef.current) {
            gestureTriggeredRef.current = true;
            if (onGestureDetected) {
                onGestureDetected(gesture);
            }
            setDebugInfo(`GESTURE RECOGNIZED: ${gesture} - Callback triggered!`);
        }
    };

    const resetGestureDetection = () => {
        setDetectedGesture(null);
        setIsHolding(false);
        setHoldProgress(0);
        holdStartTimeRef.current = 0;
    };

    const getGestureLabel = (gesture: Gesture): string => {
        switch (gesture) {
            case 'thumbsUp': return '👍 Easy';
            case 'thumbsDown': return '👎 Wrong';
            case 'flatHand': return '✋ Hard';
            default: return 'No gesture detected';
        }
    };

    return (
        <div className="gesture-detector">
            {!isModelLoaded ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading hand tracking model...</p>
                </div>
            ) : (
                <>
                    <Webcam
                        ref={webcamRef}
                        className="gesture-camera"
                        videoConstraints={{
                            facingMode: "user",
                            width: 640,
                            height: 480
                        }}
                    />
                    <div className="gesture-feedback">
                        <div className={`gesture-label ${detectedGesture ? 'active' : ''}`}>
                            {detectedGesture ? (
                                <>
                                    <div className="detected-gesture">{getGestureLabel(detectedGesture)}</div>
                                    {isHolding && (
                                        <div className="hold-instruction">
                                            Hold position to confirm ({Math.ceil(holdProgress * 3)}s)
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="waiting-gesture">Waiting for gesture...</div>
                            )}
                        </div>
                        {isHolding && (
                            <div className="hold-progress">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${holdProgress * 100}%` }}
                                />
                            </div>
                        )}
                        <div className="debug-info">{debugInfo}</div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GestureDetector; 