import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  business: any;
}

const BusinessDetailModal: React.FC<Props> = ({ isOpen, onClose, business }) => {
  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* 🔥 Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* 🔥 Modal */}
      <div className="relative bg-white w-[95%] md:w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 animate-scaleIn">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-lg"
        >
          ✕
        </button>

        {/* Cover Image */}
        {business.businessCoverImage && (
          <img
            src={business.businessCoverImage}
            alt=""
            className="w-full h-44 object-cover rounded-xl mb-4"
          />
        )}

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {business.businessName}
          </h2>
          <p className="text-sm text-blue-600 font-medium">
            {business.businessCategory}
          </p>
        </div>

        {/* Status */}
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            business.isVerified === "approved"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {business.isVerified === "approved" ? "Verified" : "Pending Approval"}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-5">
          {business.businessDescription}
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">

          <p><span className="font-semibold">📞 Phone:</span> {business.businessPhone}</p>

          <p><span className="font-semibold">🌐 Website:</span> 
            <a href={business.website} target="_blank" className="text-blue-600 ml-1 underline">
              Visit
            </a>
          </p>

          <p><span className="font-semibold">⏰ Working Hours:</span> {business.workingHours}</p>

          <p><span className="font-semibold">📍 Address:</span> {business.businessAddress}</p>

          <p><span className="font-semibold">👤 Owner:</span> {business.ownerName}</p>

          <p><span className="font-semibold">📧 Email:</span> {business.ownerEmail}</p>

          <p><span className="font-semibold">🆔 Business ID:</span> {business.businessId}</p>

          <p><span className="font-semibold">📅 Created:</span> 
            {new Date(business.userCreatedAt).toLocaleDateString()}
          </p>

        </div>

      </div>

      {/* Animation */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BusinessDetailModal;