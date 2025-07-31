import React, { useState } from 'react';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposal: { title: string; description: string; type: string }) => void;
  isCreating: boolean;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isCreating,
}) => {
  const [proposal, setProposal] = useState({
    title: '',
    description: '',
    type: '0'
  });

  const handleSubmit = () => {
    if (!proposal.title || !proposal.description) return;
    onSubmit(proposal);
    setProposal({ title: '', description: '', type: '0' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-4">Create Proposal</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={proposal.title}
              onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter proposal title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
            <textarea
              value={proposal.description}
              onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe your proposal"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
            <select
              value={proposal.type}
              onChange={(e) => setProposal({ ...proposal, type: e.target.value })}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="0">Reward Rate Change</option>
              <option value="1">Fee Change</option>
              <option value="2">Parameter Change</option>
              <option value="3">General</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating || !proposal.title || !proposal.description}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors font-semibold"
            >
              {isCreating ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProposalModal;