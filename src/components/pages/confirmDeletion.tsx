/**
 * Props we will need as an input whenever we want to delete
 * an object on our website.
 */
interface ConfirmDeleteModalProps {
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmText?: string; // optional
    cancelText?: string; // optional
}

/**
 * Modularizes our modal pop-up whenver we want to delete a survey or object
 * on our website.
 * @param {ConfirmDeleteModalProps} props: parameters we need to pass in such as
 * messages, confirmation text, etc.
 */
export default function ConfirmDeletionModal({
    title,
    message,
    onCancel,
    onConfirm,
    confirmText = "Delete",
    cancelText = "Cancel",
}: ConfirmDeleteModalProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                <p>{message}</p>
                <div className="mt-6 flex justify-end gap-4">
                    <button
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
