import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useAppConfig } from '../lib/AppContext';

export const NewProjectModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { createNewProject } = useAppConfig();
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      alert("Por favor, digite um nome.");
      return;
    }

    setIsCreating(true);
    let imageUrl = "";

    if (imageFile) {
        // Convert image file to base64 for storage
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(imageFile);
        });
    }

    await createNewProject(name, imageUrl);
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Novo Croqui</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Croqui</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="Ex: Teca III - Carga Geral"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Fundo</label>
            <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
              <Upload size={24} className="mb-2" />
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => e.target.files && setImageFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer text-sm">
                {imageFile ? imageFile.name : "Clique para selecionar ou arraste"}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button 
            onClick={handleCreate} 
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isCreating ? "Criando..." : "Criar croqui"}
          </button>
        </div>
      </div>
    </div>
  );
};
