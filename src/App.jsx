import { useEffect, useRef, useState, useCallback } from 'react'

const PLAYLIST_ID = 'PLLJOKBQMpmd8'
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`

function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function useClock() {
  const [label, setLabel] = useState('--:--')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let h = d.getHours()
      const m = d.getMinutes().toString().padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setLabel(`${h}:${m} ${ampm}`)
    }
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])
  return label
}

function useHonk() {
  const ctxRef = useRef(null)
  return useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      ctxRef.current = ctxRef.current || new AudioCtx()
      const ctx = ctxRef.current
      const now = ctx.currentTime
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.28, now + 0.5)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75)
      ;[220, 330].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, now)
        const g2 = ctx.createGain()
        g2.gain.value = i === 0 ? 0.6 : 0.4
        osc.connect(g2).connect(gain)
        osc.start(now)
        osc.stop(now + 0.75)
      })
    } catch (e) {
      /* audio unsupported */
    }
  }, [])
}

export default function App() {
  const clock = useClock()
  const honk = useHonk()

  const [honking, setHonking] = useState(false)
  const [ringKey, setRingKey] = useState(0)

  const playerRef = useRef(null)
  const playerElRef = useRef(null)
  const progressTimerRef = useRef(null)

  const [ytReady, setYtReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [songTitle, setSongTitle] = useState('Indian Highway Songs')
  const [songArtist, setSongArtist] = useState('Loading playlist…')
  const [thumb, setThumb] = useState('/playlist-thumb.jpg')
  const [curTime, setCurTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Load the YouTube IFrame API once and create the player.
  useEffect(() => {
    function createPlayer() {
      playerRef.current = new window.YT.Player(playerElRef.current, {
        height: '180',
        width: '320',
        playerVars: {
          listType: 'playlist',
          list: PLAYLIST_ID,
          autoplay: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => setYtReady(true),
          onStateChange: onPlayerStateChange,
        },
      })
    }

    function onPlayerStateChange(e) {
      if (e.data === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true)
        updateNowPlaying()
        startProgressLoop()
      } else if (e.data === window.YT.PlayerState.PAUSED) {
        setIsPlaying(false)
      } else if (e.data === window.YT.PlayerState.ENDED) {
        setIsPlaying(false)
      } else if (e.data === window.YT.PlayerState.CUED) {
        updateNowPlaying()
      }
    }

    function updateNowPlaying() {
      try {
        const p = playerRef.current
        const data = p.getVideoData()
        if (data && data.title) {
          setSongTitle(data.title)
          setSongArtist(data.author || 'Indian Highway Songs')
        }
        if (data && data.video_id) {
          setThumb(`https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`)
        }
        setDuration(p.getDuration())
      } catch (err) {
        /* not ready yet */
      }
    }

    function startProgressLoop() {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = setInterval(() => {
        const p = playerRef.current
        if (!p || !p.getCurrentTime) return
        setCurTime(p.getCurrentTime())
        setDuration(p.getDuration())
      }, 500)
    }

    if (window.YT && window.YT.Player) {
      createPlayer()
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback()
        createPlayer()
      }
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script')
        tag.id = 'yt-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    }

    return () => clearInterval(progressTimerRef.current)
  }, [])

  const togglePlay = () => {
    const p = playerRef.current
    if (!ytReady || !p) return
    if (isPlaying) p.pauseVideo()
    else p.playVideo()
  }

  const playPrev = () => {
    if (ytReady) playerRef.current.previousVideo()
  }
  const playNext = () => {
    if (ytReady) playerRef.current.nextVideo()
  }

  const seek = (e) => {
    if (!ytReady) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const dur = playerRef.current.getDuration()
    if (dur) playerRef.current.seekTo(dur * pct, true)
  }

  const pressHorn = () => {
    honk()
    setHonking(true)
    setRingKey((k) => k + 1)
    setTimeout(() => setHonking(false), 160)
  }

  const pressEngine = () => {
    honk()
    togglePlay()
  }

  const pct = duration ? (curTime / duration) * 100 : 0

  return (
    <div className="stage">
      <div className="topbar">
        <div className="clock">{clock}</div>
        <div className="status-pill">
          <span className="status-dot" />
          ON ROAD
        </div>
        <a className="yt-link" href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer">
          YouTube
        </a>
      </div>

      <div className="title-block">
        <h1>
          HORN OK<span className="accent">PLEASE</span>
        </h1>
        <div className="hindi-sub">रास्ते बोलते हैं</div>
      </div>

      <div className="horn-zone">
        <button className={`wheel-btn${honking ? ' honking' : ''}`} onClick={pressHorn} aria-label="Press the horn">
          <span key={ringKey} className="wheel-ring pulseit" />
          <img src="/steering-wheel.webp" alt="Horn OK Please steering wheel" />
        </button>
        <div className="press-label">PRESS THE HORN</div>
      </div>

      <div className="player-wrap">
        <div className="player">
          <div className="player-top">
            <img className={`art${isPlaying ? ' spinning' : ''}`} src={thumb} alt="album art" />
            <div className="meta">
              <div className="song-title">{songTitle}</div>
              <div className="song-artist">{songArtist}</div>
            </div>
            <div className="controls">
              <button className="ctrl-btn" onClick={playPrev} aria-label="Previous">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
              </button>
              <button className="ctrl-btn play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button className="ctrl-btn" onClick={playNext} aria-label="Next">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="progress-row">
            <span className="time">{fmtTime(curTime)}</span>
            <div className="bar" onClick={seek}>
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="time">{fmtTime(duration)}</span>
          </div>
        </div>
        <button className={`engine-btn${isPlaying ? ' on' : ''}`} onClick={pressEngine}>
          <span className="engine-dot" />
          <span>{isPlaying ? 'ENGINE RUNNING' : 'START ENGINE'}</span>
        </button>
      </div>

      <div id="yt-hidden-player" ref={playerElRef} />
    </div>
  )
}
