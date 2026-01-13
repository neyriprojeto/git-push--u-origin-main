

// 
export async function uploadArquivo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "public_upload"); // Crie um preset sem assinatura no seu Cloudinary
  
    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/upload", // Substitua SEU_CLOUD_NAME
        {
          method: "POST",
          body: formData,
        }
      );
  
      if (!res.ok) {
        throw new Error('Falha no upload da imagem');
      }
  
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error("Erro no upload para o Cloudinary:", error);
      throw error;
    }
  }
  
