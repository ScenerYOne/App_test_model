// src/App.jsx - หน้าตาเหมือนเดิมเป๊ะทุกอย่าง แต่ทำงานจริง 100%
import { useState } from 'react';
import { Upload, Zap, Image as ImageIcon, Brain } from 'lucide-react';
import './App.css';

function App() {
  const [modelFile, setModelFile] = useState(null);
  const [activeModelId, setActiveModelId] = useState(null);
  const [currentModelId, setCurrentModelId] = useState(null);
  const [testFile, setTestFile] = useState(null);
  const [testFilePreview, setTestFilePreview] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [classNames, setClassNames] = useState([]);

  // อัปโหลดโมเดล
  const handleModelUpload = async () => {
    if (!modelFile) return;
    setIsUploadingModel(true);
    const formData = new FormData();
    formData.append("file", modelFile);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-model", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "อัปโหลดล้มเหลว");
      setCurrentModelId(data.model_id);
      setClassNames(data.class_names);
      setActiveModelId(modelFile.name);
      alert(`โหลดโมเดลสำเร็จ! พบ ${data.class_names.length} คลาส`);
    } catch (err) {
      alert("ไม่สามารถอัปโหลดโมเดลได้: " + err.message);
    }
    setIsUploadingModel(false);
  };

  // รันตรวจจับ
  const handlePredict = async () => {
    if (!testFile || !currentModelId) return;
    setIsPredicting(true);
    const formData = new FormData();
    formData.append("file", testFile);

    try {
      const res = await fetch(`http://127.0.0.1:8000/predict?model_id=${currentModelId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "ตรวจจับล้มเหลว");
      setResultImage(`data:image/jpeg;base64,${data.image}`);
      setDetections(data.detections || []);
    } catch (err) {
      alert("ตรวจจับไม่สำเร็จ: " + err.message);
      setResultImage(testFilePreview);
    }
    setIsPredicting(false);
  };

  const handleTestFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTestFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setTestFilePreview(reader.result);
      setResultImage(null);
      setDetections([]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="inner">
          <h1 >Model Tester</h1>
        </div>
      </div>

      <div className="main-content">
        {/* ซ้าย */}
        <div>
          <h2 className="font-light mb-8 text-gray-300">Upload & Run</h2>

          {/* อัปโหลด Model */}
          <div className="mb-8">
            <label>
              <input type="file" accept=".pt" onChange={(e) => {
                if (e.target.files[0]) {
                  setModelFile(e.target.files[0]);
                  setActiveModelId(e.target.files[0].name);
                }
              }} className="hidden" />
              <div className="upload-box">
                <Brain className="w-10 h-10 text-blue-500" />
                <span className="upload-text">
                  {activeModelId || "Upload Model (.pt)"}
                </span>
              </div>
            </label>
            {modelFile && !currentModelId && (
              <button onClick={handleModelUpload} disabled={isUploadingModel} className="action-btn w-full mt-4">
                {isUploadingModel ? "กำลังโหลดโมเดล..." : "โหลดโมเดลขึ้นเซิร์ฟเวอร์"}
              </button>
            )}
            {currentModelId && <div className="text-green-400 text-sm mt-2 text-center">โมเดลพร้อมใช้งาน</div>}
          </div>

          {/* อัปโหลดภาพ */}
          <div className="mb-8">
            <label>
              <input type="file" accept="image/*" onChange={handleTestFileChange} className="hidden" />
              <div className="upload-box">
                <ImageIcon className="w-10 h-10 text-green-500" />
                <span className="upload-text">
                  {testFile ? testFile.name : "Upload Test Image"}
                </span>
              </div>
            </label>
          </div>

          <button
            onClick={handlePredict}
            disabled={isPredicting || !testFile || !currentModelId}
            className="action-btn w-full"
          >
            <Zap className="w-10 h-10" />
            {isPredicting ? "Analyzing..." : "Run Inference"}
          </button>
        </div>

        {/* ขวา */}
        <div className="result-zone">
          <h3>Inference Results</h3>

          {(testFilePreview || resultImage) ? (
            <>
              <div className="result-images">
                {testFilePreview && (
                  <div className="result-card">
                    <div className="result-label">Input</div>
                    <img src={testFilePreview} alt="Input" />
                  </div>
                )}
                {resultImage && (
                  <div className="result-card">
                    <div className="result-label">Output (Detection)</div>
                    <img src={resultImage} alt="Output" />
                  </div>
                )}
              </div>

              {detections.length > 0 && (
                <div className="stats-card">
                  {/* หัวข้อ */}
                  <div className="stats-title">Detection Summary</div>

                  {/* รายการแต่ละคลาส */}
                  {(() => {
                    const total = detections.length;
                    const summary = detections.reduce((acc, d) => {
                      const name = classNames[d.cls] || `Class ${d.cls}`;
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    }, {});

                    return Object.entries(summary)
                      .sort(([,a], [,b]) => b - a)
                      .map(([name, count]) => {
                        const percentage = ((count / total) * 100).toFixed(2);
                        return (
                          <div key={name} className="stat-item">
                            <span className="class-name text-gray-200">{name}</span>
                            <span className="text-cyan-400 font-medium">
                              {count} objects · {percentage}%
                            </span>
                          </div>
                        );
                      });
                  })()}

                  {/* ส่วนล่าง: Total + Average Confidence */}
                  <div className="mt-4">
                    <div className="stat-item-no-border">
                      <span className="text-gray-400 text-sm">Total Detections</span>
                      <span className="text-xl font-bold text-white">{detections.length}</span>
                    </div>

                    <div className="stat-item-no-border">
                      <span className="text-gray-400 text-sm">Model Avg Confidence</span>
                      <span className="text-xl font-bold text-cyan-400">
                        {detections.length > 0 
                          ? (detections.reduce((sum, d) => sum + (d.conf || 0), 0) / detections.length * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              <Brain className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <p>อัปโหลดโมเดลและภาพเพื่อเริ่มใช้งาน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;