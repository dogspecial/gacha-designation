import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas-pro';

// 모든 한글 음절은 유니코드 U+AC00 ('가') 부터 U+D7A3 ('힣') 까지 정의되어 있습니다.
const HANGUL_START_CODE = 0xAC00;
const HANGUL_END_CODE = 0xD7A3;
const TOTAL_HANGUL_CHARS = HANGUL_END_CODE - HANGUL_START_CODE + 1;
const JOKER_EMOJI = '😄';
const JOKER_PROBABILITY = 0.01; // 조커가 나올 확률 (5%)

/**
 * 랜덤 한글 음절 또는 조커를 생성하는 함수
 * @returns {string} 랜덤 한글 문자 또는 조커 이모지
 */
const getRandomCharacter = () => {
  if (Math.random() < JOKER_PROBABILITY) {
    return JOKER_EMOJI;
  }
  const randomCode = Math.floor(Math.random() * TOTAL_HANGUL_CHARS) + HANGUL_START_CODE;
  return String.fromCharCode(randomCode);
};

// 초기화 확인 모달 컴포넌트
const ConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 shadow-xl text-center">
      <h2 className="text-xl font-bold mb-4">정말 초기화할까요?</h2>
      <div className="flex justify-center gap-4">
        <button onClick={onConfirm} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">그래</button>
        <button onClick={onCancel} className="px-6 py-2 bg-slate-300 rounded-lg hover:bg-slate-400">아니</button>
      </div>
    </div>
  </div>
);

// 이미지 캡쳐 결과 모달 컴포넌트
const CaptureModal = (
  { image, onRetake, onDownload, onClose }:
  { image: string | null; onRetake: () => void; onDownload: () => void; onClose: () => void }
) => {
  if (!image) return null;
  return (
    <div className="w-full fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl text-center max-w-3xl w-full">
        <h2 className="text-2xl font-bold mb-4">캡쳐 완료!</h2>
        <img src={image} alt="Captured content" className="border-4 border-slate-200 rounded-lg mx-auto" />
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={onRetake} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">다시 찍기</button>
          <button onClick={onDownload} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">다운로드</button>
          <button onClick={onClose} className="px-6 py-2 bg-slate-300 rounded-lg hover:bg-slate-400">닫기</button>
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [numChars, setNumChars] = useState(3);
  const [characters, setCharacters] = useState(Array(3).fill(''));
  const [clickCount, setClickCount] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // 이미지 캡쳐 관련 상태
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef(null);

  useEffect(() => {
    setCharacters(Array(numChars > 0 ? numChars : 0).fill(''));
  }, [numChars]);

  const handleBoxClick = (index: number) => {
    const newChar = getRandomCharacter();
    const newCharacters = [...characters];
    newCharacters[index] = newChar;
    setCharacters(newCharacters);
    setClickCount(prev => prev + 1);
  };

  const handleResetClick = () => setShowResetModal(true);
  const confirmReset = () => {
    setCharacters(Array(numChars > 0 ? numChars : 0).fill(''));
    setClickCount(0);
    setShowResetModal(false);
  };
  const cancelReset = () => setShowResetModal(false);
  
  const handleCapture = async () => {
    if (!captureRef.current || !html2canvas) return;
    
    setIsCapturing(true); // 플래시 효과 시작

    // 플래시 효과를 위해 잠시 기다림
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        backgroundColor: null,
    });
    
    // 타임스탬프 추가
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    ctx.font = '14px Noto Sans KR';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(timestamp, canvas.width - 10, canvas.height - 10);
    
    const image = canvas.toDataURL('image/png');
    setCapturedImage(image);
    
    setIsCapturing(false); // 플래시 효과 종료
    setShowCaptureModal(true);
  };

  const downloadCapturedImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `랜덤글자_캡쳐_${Date.now()}.png`;
    link.click();
  };

  return (
    <>
      <main className="bg-slate-100 w-full min-h-screen flex items-center justify-center p-4 relative" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        {/* 캡쳐 시 플래시 효과 */}
        {isCapturing && <div className="absolute inset-0 bg-white opacity-80 z-50"></div>}
        
        <div ref={captureRef} className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-8 transition-all text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">랜덤 칭호 뽑기</h1>
          <p className="mt-2 text-slate-500">
            글자 수를 정하고 네모칸을 클릭하여 칭호를 뽑아보세요!
          </p>

          <div className="mt-6 flex justify-center items-center gap-2">
            <label htmlFor="num-chars" className="font-bold text-slate-600">글자 수:</label>
            <input
              type="number"
              id="num-chars"
              value={numChars}
              onChange={(e) => setNumChars(parseInt(e.target.value, 10))}
              min="1"
              max="20"
              className="w-20 p-2 border border-slate-300 rounded-md text-center text-black"
            />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            클릭: {clickCount}
          </p>

          <div className="my-6 flex justify-center gap-4">
            {characters.map((char, index) => (
              <div
                key={index}
                onClick={() => handleBoxClick(index)}
                className="
                  bg-slate-200 w-20 h-20 rounded-xl flex items-center justify-center
                  cursor-pointer transition-all duration-200 ease-in-out
                  hover:bg-indigo-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300
                "
                tabIndex={0}
                role="button"
                aria-label={`${index + 1}번째 글자 뽑기`}
              >
                <span className="text-5xl font-black text-slate-700 select-none">
                  {char || '?'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <button
                onClick={handleCapture}
                className="w-full p-4 rounded-lg text-lg font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
                이미지로 저장
            </button>
            <button
                onClick={handleResetClick}
                className="w-full p-4 rounded-lg text-lg font-bold bg-slate-600 text-white hover:bg-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
                초기화
            </button>
          </div>
        </div>
      </main>
      {showResetModal && <ConfirmationModal onConfirm={confirmReset} onCancel={cancelReset} />}
      {showCaptureModal && <CaptureModal 
        image={capturedImage}
        onRetake={() => { setShowCaptureModal(false); setTimeout(handleCapture, 10); }}
        onDownload={downloadCapturedImage}
        onClose={() => setShowCaptureModal(false)}
      />}
      
    </>
  );
}

