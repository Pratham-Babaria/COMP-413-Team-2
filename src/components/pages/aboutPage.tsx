import {useState} from "react";

/**
 * About page for all users to see when they
 * want to know more information about the DermIQ product.
 * Abstracted away to keep other components clean and modular.
 */
export default function AboutPage() {
    
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="min-h-screen bg-[#e5f2fb] flex items-center justify-center px-6 py-10">
            <div className="bg-white max-w-3xl p-8 rounded-xl shadow-lg space-y-6">
                <h2 className="text-3xl font-bold text-blue-600 text-center"> About Page</h2>

                <p className="text-gray-700 text-lg">
                    <strong>DermiQ</strong> is a web-based tool designed to assess dermatology expertise through 
                    interactive surveys and diagnostic tasks using dermoscopy images. Eye-tracking technology 
                    is integrated to evaluate visual attention, and machine learning models help classify gaze 
                    patterns. DermiQ allows hospitals to streamline hiring and training by quantifying diagnostic 
                    accuracy in a risk-free environment.
                </p>

                <p className="text-gray-700 text-lg">
                    As an <strong> Admin</strong> (e.g., hiring manager, committee member, or DermiQ staff), you can create, 
                    assign, and manage surveys, and review submissions. Each role has access to features 
                    aligned with its responsibilities.
                </p>

                <p className="text-gray-700 text-lg">
                    As a <strong>Responder</strong> (e.g., dermatologist, nurse, or medical student), you can take 
                    assigned surveys, review your performance, and compare against expert results. 
                </p>

                <p className="text-gray-700 text-lg">
                    <strong>Disclaimer:</strong> DermiQ is a decision-support tool and does not replace 
                    professional medical judgment. All results and assessments are intended for educational 
                    and evaluation purposes only. DermiQ assumes no legal responsibility for clinical decisions 
                    made using this tool. Your data is securely handled in compliance with HIPAA regulations.
                </p>

                <hr className="my-6" />

                <div className="text-center relative">
                    <p className="text-gray-700 text-lg">
                        Need help? Contact our support team at{" "}
                        <span
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="text-blue-500 hover:underline font-medium cursor-pointer relative"
                        >
                            support@dermiq.com
                        </span>
                    </p>
                    {showTooltip && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-sm rounded px-3 py-1 shadow-lg z-10">
                            This support email is currently under development.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}