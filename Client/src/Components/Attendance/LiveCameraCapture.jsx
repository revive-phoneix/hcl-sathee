import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X, Check } from "lucide-react";

export default function LiveCameraCapture({ open, title, onClose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [capturedBlob, setCapturedBlob] = useState(null);
    const [capturedUrl, setCapturedUrl] = useState(null);
    const [error, setError] = useState("");

    const startCamera = () => {
        setError("");
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "user" }, audio: false })
            .then((stream) => {
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch((err) => {
                console.error("Camera access error:", err);
                setError(
                    err?.name === "NotAllowedError"
                        ? "Camera access was denied. Please allow camera access to mark attendance."
                        : "Unable to access camera on this device."
                );
            });
    };

    useEffect(() => {
        if (!open) return;
        setCapturedBlob(null);
        setCapturedUrl(null);
        startCamera();

        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                setCapturedBlob(blob);
                setCapturedUrl(URL.createObjectURL(blob));
                streamRef.current?.getTracks().forEach((t) => t.stop());
            },
            "image/jpeg",
            0.9
        );
    };

    const handleRetake = () => {
        if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        setCapturedBlob(null);
        setCapturedUrl(null);
        startCamera();
    };

    const handleConfirm = () => {
        if (!capturedBlob) return;
        onCapture(capturedBlob);
        handleClose();
    };

    const handleClose = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        setCapturedBlob(null);
        setCapturedUrl(null);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                {error ? (
                    <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                ) : null}

                <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
                    {capturedUrl ? (
                        <img src={capturedUrl} alt="Captured preview" className="h-full w-full object-cover" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                    )}
                </div>
                <canvas ref={canvasRef} className="hidden" />

                {capturedBlob ? (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <RotateCcw size={16} /> Retake
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                            <X size={16} /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <Check size={16} /> Save
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled={Boolean(error)}
                        onClick={handleCapture}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Camera size={16} /> Capture
                    </button>
                )}
            </div>
        </div>
    );
}