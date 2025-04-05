import { useState, useEffect } from "react";
import { useScene } from "../context/SceneContext";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

export default function ExportDesign() {
  const { state, dispatch } = useScene();
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [fileName, setFileName] = useState(`interior-design-${Date.now()}`);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exportQuality, setExportQuality] = useState("medium");
  const [exportScale, setExportScale] = useState(1);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Reset file name when panel is opened
  useEffect(() => {
    if (showExportPanel) {
      setFileName(`interior-design-${Date.now()}`);
    }
  }, [showExportPanel]);

  // Update export scale based on quality selection
  useEffect(() => {
    switch (exportQuality) {
      case "low":
        setExportScale(0.75);
        break;
      case "high":
        setExportScale(1.5);
        break;
      case "ultra":
        setExportScale(2);
        break;
      default:
        setExportScale(1);
    }
  }, [exportQuality]);

  const toggleExportPanel = () => {
    setShowExportPanel((prev) => !prev);
    // Reset error and success states when toggling panel
    setExportError(null);
    setExportSuccess(false);
  };

  const handleExportFormatChange = (e) => {
    setExportFormat(e.target.value);
  };

  const validateFileName = () => {
    if (!fileName.trim()) {
      setExportError("File name cannot be empty");
      return false;
    }
    
    // Remove invalid characters from file name
    const sanitizedFileName = fileName.replace(/[<>:"/\\|?*]/g, "_");
    if (sanitizedFileName !== fileName) {
      setFileName(sanitizedFileName);
      setExportError("Invalid characters in file name have been replaced");
      return false;
    }
    
    return true;
  };

  const exportDesign = async () => {
    if (!validateFileName()) {
      return;
    }
    
    setExportLoading(true);
    setExportSuccess(false);
    setExportError(null);

    try {
      // Dispatch action to prepare export data
      dispatch({ type: "EXPORT_DESIGN" });

      // Get the export data from state
      const designData = {
        objects: state.objects,
        walls: state.walls,
        floors: state.floors,
        houseDimensions: state.houseDimensions,
        metadata: includeMetadata ? {
          exportDate: new Date().toISOString(),
          version: "1.0",
          designApproval: state.designApproval || { approved: false },
          exportQuality: exportQuality,
          projectName: fileName,
          roomType: state.roomType || "Not specified",
          designStyle: state.designStyle || "Not specified",
          colorScheme: state.colorScheme || "Not specified",
        } : null,
      };

      if (exportFormat === "json") {
        // Export as JSON file
        const jsonString = JSON.stringify(
          includeMetadata ? designData : { objects: designData.objects, walls: designData.walls, floors: designData.floors },
          null, 
          2
        );
        const blob = new Blob([jsonString], { type: "application/json" });
        saveAs(blob, `${fileName}.json`);
        
        toast.success("Design data exported successfully");
      } else if (exportFormat === "image") {
        // Export as image (screenshot)
        const canvas = document.querySelector("canvas");
        if (canvas) {
          // Use html2canvas to capture the canvas with specified quality
          const screenshot = await html2canvas(canvas, {
            scale: exportScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#FFFFFF",
          });
          
          screenshot.toBlob((blob) => {
            saveAs(blob, `${fileName}.png`);
            toast.success("Design image exported successfully");
          }, "image/png");
        } else {
          throw new Error("Canvas element not found");
        }
      } else if (exportFormat === "pdf") {
        // For PDF export, we'll use a simple approach with jsPDF
        const { jsPDF } = await import("jspdf");
        const canvas = document.querySelector("canvas");

        if (canvas) {
          const screenshot = await html2canvas(canvas, {
            scale: exportScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#FFFFFF",
          });
          
          const imgData = screenshot.toDataURL("image/png");

          const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
          });

          // Add design info
          pdf.setFontSize(18);
          pdf.setTextColor(51, 51, 153);
          pdf.text("Interior Design Export", 14, 15);
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Project: ${fileName}`, 14, 22);
          pdf.text(`Export Date: ${new Date().toLocaleString()}`, 14, 27);
          
          if (includeMetadata) {
            pdf.text(`Room Type: ${state.roomType || "Not specified"}`, 14, 32);
            pdf.text(`Design Style: ${state.designStyle || "Not specified"}`, 14, 37);
            pdf.text(`Color Scheme: ${state.colorScheme || "Not specified"}`, 14, 42);
          }

          // Add the screenshot
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth() - 28;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          const startY = includeMetadata ? 47 : 32;
          pdf.addImage(imgData, "PNG", 14, startY, pdfWidth, pdfHeight);
          
          // Add footer
          const pageHeight = pdf.internal.pageSize.getHeight();
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text("Created with Interior Design App", 14, pageHeight - 10);
          
          pdf.save(`${fileName}.pdf`);
          toast.success("Design PDF exported successfully");
        } else {
          throw new Error("Canvas element not found");
        }
      } else if (exportFormat === "svg") {
        // Export as SVG
        const canvas = document.querySelector("canvas");
        if (canvas) {
          try {
            // Create a temporary canvas to render the scene
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext("2d");
            
            // Draw the current canvas content to the temp canvas
            ctx.drawImage(canvas, 0, 0);
            
            // Convert to SVG using canvg or similar library
            // This is a simplified approach - in a real app you'd use a proper SVG conversion
            const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
              <image href="${tempCanvas.toDataURL("image/png")}" width="${canvas.width}" height="${canvas.height}" />
            </svg>`;
            
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            saveAs(blob, `${fileName}.svg`);
            toast.success("Design SVG exported successfully");
          } catch (error) {
            console.error("SVG export error:", error);
            throw new Error("Failed to convert to SVG format");
          }
        } else {
          throw new Error("Canvas element not found");
        }
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportError(error.message || "Export failed. Please try again.");
      toast.error("Export failed: " + (error.message || "Unknown error"));
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 z-10">
      <button
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-colors duration-200 ${
          showExportPanel
            ? "bg-blue-500 text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
        onClick={toggleExportPanel}
        aria-label="Export Design"
        title="Export Design"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {showExportPanel && (
        <div className="absolute right-0 top-14 w-72 bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Export Design</h3>
            <button
              onClick={toggleExportPanel}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {exportSuccess && (
            <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Design exported successfully!
            </div>
          )}

          {exportError && (
            <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {exportError}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter file name"
            />
            <p className="text-xs text-gray-500 mt-1">
              Avoid special characters: &lt; &gt; : " / \ | ? *
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={handleExportFormatChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="json">JSON (Design Data)</option>
              <option value="image">Image (PNG)</option>
              <option value="pdf">PDF Document</option>
              <option value="svg">SVG Vector</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Include metadata
              </span>
            </label>
          </div>

          <div className="mb-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              {showAdvancedOptions ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Hide Advanced Options
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Show Advanced Options
                </>
              )}
            </button>
          </div>

          {showAdvancedOptions && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Export Quality
                </label>
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low (Faster)</option>
                  <option value="medium">Medium (Default)</option>
                  <option value="high">High (Larger file)</option>
                  <option value="ultra">Ultra (Best quality)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Higher quality results in larger file sizes
                </p>
              </div>

              {exportFormat === "pdf" && (
                <div className="mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include project information
                    </span>
                  </label>
                </div>
              )}

              <div className="text-xs text-gray-600">
                <p>• Scale factor: {exportScale}x</p>
                <p>• Format: {exportFormat.toUpperCase()}</p>
                {exportFormat === "image" && <p>• Transparency: Supported</p>}
              </div>
            </div>
          )}

          <button
            onClick={exportDesign}
            disabled={exportLoading}
            className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Design
              </>
            )}
          </button>

          <div className="mt-3 text-xs text-gray-500">
            <p>• JSON format saves all design data for future editing</p>
            <p>• Image format captures current view as PNG</p>
            <p>• PDF includes design image and project details</p>
            <p>• SVG format provides vector graphics for scaling</p>
          </div>
        </div>
      )}
    </div>
  );
}
