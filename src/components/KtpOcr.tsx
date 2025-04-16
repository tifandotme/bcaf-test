import { useState, useRef, useCallback } from "react";
import { Button } from "../components/ui/button";
import { createWorker, PSM } from "tesseract.js";

interface KtpData {
  nik?: string;
  name?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  rt?: string;
  rw?: string;
  village?: string;
  district?: string;
  religion?: string;
  maritalStatus?: string;
  occupation?: string;
  nationality?: string;
  validUntil?: string;
}

export const KtpOcr = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ktpData, setKtpData] = useState<KtpData | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setRawText("");
    const file = event.target.files?.[0];

    if (file) {
      if (!file.type.includes("image")) {
        setErrorMessage("Please upload a valid image file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setKtpData(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const preprocessImage = useCallback(
    async (imageUrl: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) {
            resolve(imageUrl); // Return original if canvas ref not available
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(imageUrl);
            return;
          }

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

            // Apply threshold for better OCR
            const threshold = 120;
            const value = avg > threshold ? 255 : 0;

            data[i] = value; // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
          }

          // Put processed image back
          ctx.putImageData(imageData, 0, 0);

          // Get processed image as URL
          const processedImageUrl = canvas.toDataURL("image/png");
          resolve(processedImageUrl);
        };

        img.src = imageUrl;
      });
    },
    [],
  );

  const extractKtpData = async () => {
    if (!image) return;

    setIsProcessing(true);
    try {
      // Preprocess image for better OCR
      const processedImage = await preprocessImage(image);

      const worker = await createWorker("ind");

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: "1",
      });

      const {
        data: { text },
      } = await worker.recognize(processedImage);
      setRawText(text); // Store raw text for debugging

      await worker.terminate();

      const normalizedText = text.toLowerCase().replace(/\s+/g, " ");
      console.log("Normalized OCR Text:", normalizedText);

      const extractedData: KtpData = {};

      const nikPattern = /nik\s*:?\s*(\d{16})/i;
      const nikAltPattern = /nik\s*:?\s*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/i;
      const nikBackupPattern = /\b(\d{16})\b/;
      const nikMatch =
        text.match(nikPattern) ||
        text.match(nikAltPattern) ||
        text.match(nikBackupPattern);
      if (nikMatch) extractedData.nik = nikMatch[1].replace(/\s/g, "");

      const namePattern = /nama\s*:?\s*([^\n]+)/i;
      const nameMatch = text.match(namePattern);
      if (nameMatch) {
        extractedData.name = nameMatch[1].trim();
      }

      const birthPattern = /tempat\/tgl lahir\s*:?\s*([^,]+),\s*([^\n]+)/i;
      const birthMatch = text.match(birthPattern);
      if (birthMatch) {
        extractedData.birthPlace = birthMatch[1].trim();
        extractedData.birthDate = birthMatch[2].trim();
      }

      const genderPattern = /jenis kelamin\s*:?\s*([^\s]+)/i;
      const genderMatch = text.match(genderPattern);
      if (genderMatch) {
        extractedData.gender = genderMatch[1].trim();
      } else if (
        normalizedText.includes("laki-laki") ||
        normalizedText.includes("laki laki")
      ) {
        extractedData.gender = "LAKI-LAKI";
      } else if (normalizedText.includes("perempuan")) {
        extractedData.gender = "PEREMPUAN";
      }

      const addressPattern = /alamat\s*:?\s*([^\n]+)/i;
      const addressMatch = text.match(addressPattern);
      if (addressMatch) {
        extractedData.address = addressMatch[1].trim();
      }

      const rtRwPattern = /rt\/rw\s*:?\s*(\d+)\/(\d+)/i;
      const rtRwMatch = text.match(rtRwPattern);
      if (rtRwMatch) {
        extractedData.rt = rtRwMatch[1];
        extractedData.rw = rtRwMatch[2];
      }

      const villagePattern = /kel\/desa\s*:?\s*([^\n]+)/i;
      const villageMatch = text.match(villagePattern);
      if (villageMatch) {
        extractedData.village = villageMatch[1].trim();
      }

      const districtPattern = /kecamatan\s*:?\s*([^\n]+)/i;
      const districtMatch = text.match(districtPattern);
      if (districtMatch) {
        extractedData.district = districtMatch[1].trim();
      }

      const religionPattern = /agama\s*:?\s*([^\n]+)/i;
      const religionMatch = text.match(religionPattern);
      if (religionMatch) {
        extractedData.religion = religionMatch[1].trim();
      }

      const maritalPattern = /status perkawinan\s*:?\s*([^\n]+)/i;
      const maritalMatch = text.match(maritalPattern);
      if (maritalMatch) {
        extractedData.maritalStatus = maritalMatch[1].trim();
      }

      const occupationPattern = /pekerjaan\s*:?\s*([^\n]+)/i;
      const occupationMatch = text.match(occupationPattern);
      if (occupationMatch) {
        extractedData.occupation = occupationMatch[1].trim();
      }

      const nationalityPattern = /kewarganegaraan\s*:?\s*([^\n]+)/i;
      const nationalityMatch = text.match(nationalityPattern);
      if (nationalityMatch) {
        extractedData.nationality = nationalityMatch[1].trim();
      }

      const validUntilPattern = /berlaku hingga\s*:?\s*([^\n]+)/i;
      const validUntilMatch = text.match(validUntilPattern);
      if (validUntilMatch) {
        extractedData.validUntil = validUntilMatch[1].trim();
      }

      setKtpData(extractedData);
    } catch (error) {
      console.error("OCR processing error:", error);
      setErrorMessage("Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center">KTP OCR Scanner</h1>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />

        <Button onClick={handleUploadClick} className="w-48">
          Upload KTP Image
        </Button>

        {errorMessage && (
          <div className="text-red-500 text-sm">{errorMessage}</div>
        )}

        {image && (
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className="relative border rounded-md overflow-hidden w-full max-w-md">
              <img src={image} alt="Uploaded KTP" className="w-full h-auto" />
            </div>

            <Button
              onClick={extractKtpData}
              disabled={isProcessing || !image}
              className="w-48"
            >
              {isProcessing ? "Processing..." : "Extract Data"}
            </Button>

            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-sm text-gray-500 underline"
              type="button"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>
          </div>
        )}
      </div>

      {showDebug && rawText && (
        <div className="border rounded-lg p-4 bg-gray-50 mt-4">
          <h3 className="font-medium mb-2">Raw OCR Text:</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {rawText}
          </pre>
        </div>
      )}

      {ktpData && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Extracted KTP Data</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ktpData.nik && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">NIK</p>
                <p>{ktpData.nik}</p>
              </div>
            )}

            {ktpData.name && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Name</p>
                <p>{ktpData.name}</p>
              </div>
            )}

            {ktpData.birthPlace && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Birth Place</p>
                <p>{ktpData.birthPlace}</p>
              </div>
            )}

            {ktpData.birthDate && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Birth Date</p>
                <p>{ktpData.birthDate}</p>
              </div>
            )}

            {ktpData.gender && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Gender</p>
                <p>{ktpData.gender}</p>
              </div>
            )}

            {ktpData.address && (
              <div className="space-y-1 col-span-1 md:col-span-2">
                <p className="font-medium text-gray-500">Address</p>
                <p>{ktpData.address}</p>
              </div>
            )}

            {(ktpData.rt || ktpData.rw) && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">RT/RW</p>
                <p>
                  {ktpData.rt}/{ktpData.rw}
                </p>
              </div>
            )}

            {ktpData.village && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Village</p>
                <p>{ktpData.village}</p>
              </div>
            )}

            {ktpData.district && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">District</p>
                <p>{ktpData.district}</p>
              </div>
            )}

            {ktpData.religion && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Religion</p>
                <p>{ktpData.religion}</p>
              </div>
            )}

            {ktpData.maritalStatus && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Marital Status</p>
                <p>{ktpData.maritalStatus}</p>
              </div>
            )}

            {ktpData.occupation && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Occupation</p>
                <p>{ktpData.occupation}</p>
              </div>
            )}

            {ktpData.nationality && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Nationality</p>
                <p>{ktpData.nationality}</p>
              </div>
            )}

            {ktpData.validUntil && (
              <div className="space-y-1">
                <p className="font-medium text-gray-500">Valid Until</p>
                <p>{ktpData.validUntil}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
