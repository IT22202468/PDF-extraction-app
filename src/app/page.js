"use client";
import React, { useState } from "react";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist/webpack";

export default function Home() {

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  console.log(apiKey);

  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [details, setDetails] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const extractTextFromPDF = async (file) => {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async () => {
        try {
          const pdfData = new Uint8Array(fileReader.result);
          const pdfDoc = await pdfjsLib.getDocument(pdfData).promise;
          let textContent = "";
          
          // Loop through all the pages and extract text
          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const content = await page.getTextContent();
            content.items.forEach((item) => {
              textContent += item.str + " ";
            });
          }
          
          resolve(textContent);
        } catch (err) {
          reject(err);
        }
      };

      fileReader.onerror = (err) => reject(err);
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file!");
      return;
    }

    try {
      const text = await extractTextFromPDF(file);
      setExtractedText(text);

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          max_tokens: 2000,
          temperature: 0.7,
          prompt: `Extract SAP number, Supplier, PI number, and Invoice number from the following text:\n\n${text}`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          }
        }
      );

      setDetails(response.data.choices[0].text.trim());
    } catch (error) {
      console.error("Error processing file or API request:", error);
      alert("An error occurred. Please check the console for details.");
    }
  };

  return (
    <div className="p-8 bg-purple-100 min-h-screen">
      <h1 className="text-3xl font-bold text-purple-800 mb-4">PDF Text Extraction App</h1>
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500"
        />
      </div>
      <button
        onClick={handleUpload}
        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-transform transform hover:scale-105"
      >
        Extract Details
      </button>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-purple-700">Extracted Text:</h2>
        <textarea
          value={extractedText}
          readOnly
          rows={10}
          className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-500"
        ></textarea>
      </div>
      <div className="mt-6">
        <h2 className="text-2xl font-semibold text-purple-700">Extracted Details:</h2>
        <pre className="w-full mt-2 p-3 bg-gray-100 border border-gray-300 rounded-lg overflow-auto">
          {details}
        </pre>
      </div>
    </div>
  );
}
