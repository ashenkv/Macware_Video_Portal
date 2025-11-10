import React, { useState, useEffect } from "react";
import API from "../services/api";
import ReactPlayer from "react-player";

function VideoList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [useNativePlayer, setUseNativePlayer] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await API.get("/videos");
        setVideos(res.data);
        console.log("Fetched videos:", res.data);

        res.data.forEach((video) => {
          console.log(`Video ${video.id}:`, {
            title: video.title,
            videoUrl: video.videoUrl,
            urlLength: video.videoUrl?.length,
            isValidUrl: video.videoUrl?.startsWith("http"),
          });
        });
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        alert("Failed to load videos. Check console.");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) return <p>Loading videos...</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>🎥 Video Library</h2>

      {selectedVideo ? (
        <div style={{ marginBottom: "30px" }}>
          <h3>{selectedVideo.title}</h3>
          <p>{selectedVideo.description}</p>

          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              minHeight: "200px",
            }}
          >
            {selectedVideo.videoUrl &&
            selectedVideo.videoUrl.startsWith("http") ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                {/* Fix: Ensure URL ends with .mp4 */}
                {(() => {
                  const videoUrl = selectedVideo.videoUrl.endsWith(".mp4")
                    ? selectedVideo.videoUrl
                    : `${selectedVideo.videoUrl}.mp4`;

                  return (
                    <>
                      {/* Try ReactPlayer first */}
                      {!useNativePlayer && (
                        <ReactPlayer
                          url={videoUrl}
                          controls
                          width="100%"
                          height="60%"
                          playing={false}
                          onError={(e) => {
                            console.error("ReactPlayer error:", e);
                            setUseNativePlayer(true);
                          }}
                          config={{
                            file: {
                              attributes: {
                                controlsList: "nodownload",
                                crossOrigin: "anonymous",
                              },
                              forceVideo: true,
                            },
                          }}
                        />
                      )}

                      {/* Fallback to native video if needed */}
                      {useNativePlayer && (
                        <video
                          controls
                          width="100%"
                          height="60%"
                          style={{ position: "absolute", top: 0, left: 0 }}
                          onError={(e) =>
                            console.error("Native video error:", e)
                          }
                          onCanPlay={() => console.log("Native video can play")}
                        >
                          <source src={videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f0f0f0",
                }}
              >
                <p style={{ color: "red", textAlign: "center" }}>
                  ❌ Invalid video URL: {selectedVideo.videoUrl || "No URL"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedVideo(null)}
            style={{ marginTop: "10px", marginRight: "10px" }}
          >
            ← Back to List
          </button>

          <button
            onClick={() => {
              console.log("Testing video URL:", selectedVideo.videoUrl);
              fetch(selectedVideo.videoUrl, { method: "HEAD" })
                .then((response) => {
                  console.log("Video URL accessible:", response.ok);
                  console.log(
                    "Content-Type:",
                    response.headers.get("content-type")
                  );
                })
                .catch((error) => {
                  console.error("Video URL not accessible:", error);
                });
            }}
            style={{ marginTop: "10px" }}
          >
            Test Video URL
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {videos.length === 0 ? (
            <p>No videos available.</p>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                style={videoCardStyle}
                onClick={() => {
                  setSelectedVideo(video);
                  setUseNativePlayer(false);
                }}
              >
                <h4>{video.title}</h4>
                <p>
                  <strong>Course:</strong> {video.course?.title || "Unknown"}
                </p>
                <p>
                  <strong>Teacher:</strong>{" "}
                  {video.course?.teacher?.name || "Unknown"}
                </p>
                <p>
                  <strong>Duration:</strong> {video.duration}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const videoCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "15px",
  cursor: "pointer",
  transition: "background 0.2s",
  backgroundColor: "#fff",
  maxWidth: "600px",
  margin: "0 auto",
};

export default VideoList;
