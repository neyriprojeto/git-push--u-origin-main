// Substitua 'SEU_CLOUD_NAME' pelo seu Cloud Name real do Cloudinary.
const CLOUD_NAME = "SEU_CLOUD_NAME"; 
const UPLOAD_PRESET = "public_upload";

/**
 * Envia um arquivo para o Cloudinary e retorna a URL segura.
 * @param file O arquivo a ser enviado.
 * @returns A URL segura do arquivo no Cloudinary.
 */
export async function uploadArquivo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
  
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
  
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Falha no upload do Cloudinary:', errorData);
        throw new Error(`Falha no upload da imagem: ${errorData.error.message}`);
      }
  
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error("Erro no upload para o Cloudinary:", error);
      throw error;
    }
  }