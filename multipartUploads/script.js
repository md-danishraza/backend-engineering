/**
 * MULTIPART UPLOADS VISUAL ARCHITECTURE & SIMULATION ENGINE
 * Pure Vanilla ES6+ - Self-contained, Interactive, Responsive
 */

// ============================================================================
// 1. App State & Presets
// ============================================================================

const PRESETS = {
  video: { name: '🎬 4K Raw Drone Footage', sizeMB: 1200, partSizeMB: 50, mime: 'video/mp4' },
  database: { name: '💾 PostgreSQL Production Dump', sizeMB: 600, partSizeMB: 50, mime: 'application/octet-stream' },
  vmimage: { name: '📦 Linux VM Virtual Disk', sizeMB: 3200, partSizeMB: 100, mime: 'application/x-iso9660-image' },
  archive: { name: '📚 Compressed Archives Zip', sizeMB: 250, partSizeMB: 25, mime: 'application/zip' },
  custom: { name: '⚙️ Custom Configuration', sizeMB: 800, partSizeMB: 50, mime: 'application/octet-stream' }
};

const NETWORK_PROFILES = {
  fiber: { baseDelay: 350, jitter: 150, dropRate: 0.00, speedMBps: 85 },
  cable: { baseDelay: 650, jitter: 250, dropRate: 0.03, speedMBps: 35 },
  flaky: { baseDelay: 1100, jitter: 400, dropRate: 0.20, speedMBps: 12 },
  chaos: { baseDelay: 800, jitter: 350, dropRate: 0.40, speedMBps: 20 }
};

// ============================================================================
// 2. Simulator Controller
// ============================================================================

class MultipartSimulator {
  constructor() {
    // Configuration
    this.currentPresetKey = 'video';
    this.fileSizeMB = PRESETS.video.sizeMB;
    this.partSizeMB = PRESETS.video.partSizeMB;
    this.mimeType = PRESETS.video.mime;
    this.concurrency = 3;
    this.networkKey = 'fiber';
    this.injectDropNext = false;
    this.speed = 0.25; // Default to 0.25x for clear, detailed step-by-step observation

    // Simulation Session State
    this.status = 'IDLE'; // IDLE | RUNNING | PAUSED | COMPLETED | ABORTED
    this.uploadId = null;
    this.chunks = [];
    this.activeWorkers = 0;
    this.workerPool = [];
    this.retriesCount = 0;
    this.uploadedBytes = 0;
    this.stepMode = false;
    this.stepTrigger = null;

    // Animation frames and timing
    this.animFrameId = null;
    this.startTime = null;

    // Cache DOM Elements
    this.dom = {
      presetSelect: document.getElementById('filePresetSelect'),
      chunkSizeSelect: document.getElementById('chunkSizeSelect'),
      chunkSizeGroup: document.getElementById('chunkSizeGroup'),
      customFileRow: document.getElementById('customFileRow'),
      customFileSize: document.getElementById('customFileSize'),
      customPartSize: document.getElementById('customPartSize'),
      applyCustomBtn: document.getElementById('applyCustomBtn'),
      concurrencyRange: document.getElementById('concurrencyRange'),
      concurrencyValue: document.getElementById('concurrencyValue'),
      networkSelect: document.getElementById('networkConditionSelect'),
      startBtn: document.getElementById('startBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      stepBtn: document.getElementById('stepBtn'),
      failNextBtn: document.getElementById('failNextBtn'),
      resetBtn: document.getElementById('resetBtn'),
      abortBtn: document.getElementById('abortBtn'),
      speedLabel: document.getElementById('speedLabel'),
      speedBtns: document.querySelectorAll('.speed-btn'),
      simStatusDot: document.getElementById('simStatusDot'),
      simStatusLabel: document.getElementById('simStatusLabel'),
      // Node Elements
      nodeClient: document.getElementById('nodeClient'),
      nodeAuth: document.getElementById('nodeAuth'),
      nodeStorage: document.getElementById('nodeStorage'),
      nodeClientSlicing: document.getElementById('nodeClientSlicing'),
      nodeClientWorkers: document.getElementById('nodeClientWorkers'),
      nodeClientCache: document.getElementById('nodeClientCache'),
      nodeAuthUploadId: document.getElementById('nodeAuthUploadId'),
      nodeAuthPresignedCount: document.getElementById('nodeAuthPresignedCount'),
      nodeStoragePartsCount: document.getElementById('nodeStoragePartsCount'),
      nodeStorageFinalETag: document.getElementById('nodeStorageFinalETag'),
      storageStagingVisual: document.getElementById('storageStagingVisual'),
      workerTracksContainer: document.getElementById('workerTracksContainer'),
      // Metrics & Chunks
      overallProgressBar: document.getElementById('overallProgressBar'),
      overallPercent: document.getElementById('overallPercent'),
      statUploadedBytes: document.getElementById('statUploadedBytes'),
      statCompletedParts: document.getElementById('statCompletedParts'),
      statSpeed: document.getElementById('statSpeed'),
      statRetries: document.getElementById('statRetries'),
      chunkGrid: document.getElementById('chunkGrid'),
      telemetryLog: document.getElementById('telemetryLog'),
      clearLogBtn: document.getElementById('clearLogBtn'),
      // SVG Layer
      archSvg: document.getElementById('archSvg'),
      pathClientToAuth: document.getElementById('pathClientToAuth'),
      pathAuthToStorage: document.getElementById('pathAuthToStorage'),
      pathClientToStorage: document.getElementById('pathClientToStorage'),
      packetContainer: document.getElementById('packetContainer'),
      // Modal
      chunkModal: document.getElementById('chunkModal'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalBody: document.getElementById('modalBody'),
      modalPartBadge: document.getElementById('modalPartBadge')
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.buildChunkManifest();
    this.renderChunksGrid();
    this.renderWorkerSlots();
    this.updateSvgPaths();
    this.updateUI();

    window.addEventListener('resize', () => {
      this.updateSvgPaths();
    });
  }

  bindEvents() {
    // Preset change
    this.dom.presetSelect.addEventListener('change', (e) => {
      this.currentPresetKey = e.target.value;
      if (this.currentPresetKey === 'custom') {
        this.dom.customFileRow.classList.remove('hidden');
        this.dom.chunkSizeGroup.classList.add('hidden');
      } else {
        this.dom.customFileRow.classList.add('hidden');
        this.dom.chunkSizeGroup.classList.remove('hidden');
        const p = PRESETS[this.currentPresetKey];
        this.fileSizeMB = p.sizeMB;
        this.partSizeMB = p.partSizeMB;
        this.mimeType = p.mime;
        this.dom.chunkSizeSelect.value = String(p.partSizeMB);
      }
      this.resetSimulation();
    });

    // Chunk size change
    this.dom.chunkSizeSelect.addEventListener('change', (e) => {
      this.partSizeMB = parseInt(e.target.value, 10);
      this.resetSimulation();
    });

    // Custom configuration apply
    this.dom.applyCustomBtn.addEventListener('click', () => {
      const s = parseInt(this.dom.customFileSize.value, 10) || 500;
      const c = parseInt(this.dom.customPartSize.value, 10) || 50;
      this.fileSizeMB = Math.max(50, s);
      this.partSizeMB = Math.max(5, Math.min(c, this.fileSizeMB));
      this.resetSimulation();
      this.logTelemetry(`Custom configuration set: Total ${this.fileSizeMB} MB with ${this.partSizeMB} MB parts.`, 'system');
    });

    // Concurrency slider
    this.dom.concurrencyRange.addEventListener('input', (e) => {
      this.concurrency = parseInt(e.target.value, 10);
      this.dom.concurrencyValue.textContent = this.concurrency;
      this.renderWorkerSlots();
      this.logTelemetry(`Worker concurrency set to ${this.concurrency} streams.`, 'system');
    });

    // Network select
    this.dom.networkSelect.addEventListener('change', (e) => {
      this.networkKey = e.target.value;
      this.logTelemetry(`Network profile switched to ${this.dom.networkSelect.options[this.dom.networkSelect.selectedIndex].text}`, 'system');
    });

    // Speed adjustment buttons (0.25x, 0.5x, 1.0x, 2.0x)
    this.dom.speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dom.speedBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.speed = parseFloat(btn.getAttribute('data-speed')) || 0.25;

        const speedDescriptions = {
          0.25: '0.25x (Super Slow)',
          0.5: '0.5x (Slow)',
          1: '1.0x (Normal)',
          2: '2.0x (Fast)'
        };
        const desc = speedDescriptions[this.speed] || `${this.speed}x`;
        if (this.dom.speedLabel) {
          this.dom.speedLabel.textContent = desc;
        }
        this.logTelemetry(`Simulation speed adjusted to ${desc}.`, 'system');
      });
    });

    // Action buttons
    this.dom.startBtn.addEventListener('click', () => this.startSimulation());
    this.dom.pauseBtn.addEventListener('click', () => this.togglePause());
    this.dom.stepBtn.addEventListener('click', () => this.stepForward());
    this.dom.failNextBtn.addEventListener('click', () => this.injectDrop());
    this.dom.resetBtn.addEventListener('click', () => this.resetSimulation());
    this.dom.abortBtn.addEventListener('click', () => this.abortSimulation());

    // Clear log
    this.dom.clearLogBtn.addEventListener('click', () => {
      this.dom.telemetryLog.innerHTML = '';
      this.logTelemetry('Telemetry log cleared.', 'system');
    });

    // Modal close
    this.dom.modalCloseBtn.addEventListener('click', () => {
      this.dom.chunkModal.classList.add('hidden');
    });
    this.dom.chunkModal.addEventListener('click', (e) => {
      if (e.target === this.dom.chunkModal) {
        this.dom.chunkModal.classList.add('hidden');
      }
    });
  }

  // Build the list of chunks based on file size and part size
  buildChunkManifest() {
    this.chunks = [];
    const totalParts = Math.ceil(this.fileSizeMB / this.partSizeMB);
    const totalBytes = this.fileSizeMB * 1024 * 1024;
    const partSizeBytes = this.partSizeMB * 1024 * 1024;

    for (let i = 0; i < totalParts; i++) {
      const partNumber = i + 1;
      const start = i * partSizeBytes;
      const end = Math.min(totalBytes, (i + 1) * partSizeBytes);
      const sizeBytes = end - start;
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);

      this.chunks.push({
        partNumber,
        start,
        end,
        sizeBytes,
        sizeMB,
        status: 'pending', // pending | slicing | uploading | completed | retry
        progress: 0,
        attempts: 0,
        eTag: null,
        latencyMs: 0,
        presignedUrl: null
      });
    }

    this.uploadedBytes = 0;
    this.retriesCount = 0;
  }

  renderChunksGrid() {
    this.dom.chunkGrid.innerHTML = '';
    this.chunks.forEach((chunk) => {
      const item = document.createElement('div');
      item.className = `chunk-item ${chunk.status}`;
      item.id = `chunk-item-${chunk.partNumber}`;
      item.title = `Part #${chunk.partNumber} (${chunk.sizeMB} MB) - Click to inspect`;
      item.innerHTML = `
        <span class="chunk-num">#${chunk.partNumber}</span>
        <span class="chunk-sub">${chunk.sizeMB}MB</span>
      `;
      item.addEventListener('click', () => this.openChunkModal(chunk.partNumber));
      this.dom.chunkGrid.appendChild(item);
    });
    this.updateStats();
  }

  renderWorkerSlots() {
    this.dom.workerTracksContainer.innerHTML = '';
    for (let i = 1; i <= this.concurrency; i++) {
      const slot = document.createElement('div');
      slot.className = 'worker-slot';
      slot.id = `workerSlot${i}`;
      slot.innerHTML = `<span class="w-name">W${i}</span><span class="w-status">Idle</span>`;
      this.dom.workerTracksContainer.appendChild(slot);
    }
  }

  updateWorkerSlot(slotIndex, isBusy, text = 'Idle') {
    const slot = document.getElementById(`workerSlot${slotIndex + 1}`);
    if (slot) {
      if (isBusy) {
        slot.classList.add('busy');
        slot.querySelector('.w-status').textContent = text;
      } else {
        slot.classList.remove('busy');
        slot.querySelector('.w-status').textContent = 'Idle';
      }
    }
  }

  // Update SVG connecting lines between nodes
  updateSvgPaths() {
    if (window.innerWidth <= 1024) return; // Hidden in mobile view

    const svgRect = this.dom.archSvg.getBoundingClientRect();
    const clientRect = this.dom.nodeClient.getBoundingClientRect();
    const authRect = this.dom.nodeAuth.getBoundingClientRect();
    const storageRect = this.dom.nodeStorage.getBoundingClientRect();

    if (!svgRect.width) return;

    // Node midpoints relative to SVG
    const clientRightX = clientRect.right - svgRect.left;
    const clientMidY = clientRect.top + clientRect.height / 2 - svgRect.top;

    const authLeftX = authRect.left - svgRect.left;
    const authRightX = authRect.right - svgRect.left;
    const authMidY = authRect.top + authRect.height / 2 - svgRect.top;

    const storageLeftX = storageRect.left - svgRect.left;
    const storageMidY = storageRect.top + storageRect.height / 2 - svgRect.top;

    // Direct wire from client under auth straight to storage
    const clientBottomY = clientRect.bottom - svgRect.top - 20;
    const storageBottomY = storageRect.bottom - svgRect.top - 20;

    // 1. Client to Auth Line
    this.dom.pathClientToAuth.setAttribute(
      'd',
      `M ${clientRightX} ${clientMidY} C ${(clientRightX + authLeftX) / 2} ${clientMidY}, ${(clientRightX + authLeftX) / 2} ${authMidY}, ${authLeftX} ${authMidY}`
    );

    // 2. Auth to Storage Line
    this.dom.pathAuthToStorage.setAttribute(
      'd',
      `M ${authRightX} ${authMidY} C ${(authRightX + storageLeftX) / 2} ${authMidY}, ${(authRightX + storageLeftX) / 2} ${storageMidY}, ${storageLeftX} ${storageMidY}`
    );

    // 3. Direct Client to Storage High-Throughput Wire
    this.dom.pathClientToStorage.setAttribute(
      'd',
      `M ${clientRightX} ${clientBottomY} C ${svgRect.width * 0.35} ${clientBottomY + 70}, ${svgRect.width * 0.65} ${storageBottomY + 70}, ${storageLeftX} ${storageBottomY}`
    );
  }

  // Spawn an animated data packet along an SVG curve
  animateSvgPacket(pathElement, label, color = '#6366f1', durationMs = 800) {
    if (window.innerWidth <= 1024 || !pathElement) return;

    const totalLength = pathElement.getTotalLength();
    if (!totalLength) return;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'animated-packet');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '7');
    circle.setAttribute('fill', color);
    circle.setAttribute('class', 'packet-circle');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('y', '-12');
    text.setAttribute('class', 'packet-label');
    text.textContent = label;

    group.appendChild(circle);
    group.appendChild(text);
    this.dom.packetContainer.appendChild(group);

    const startTime = performance.now();

    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const point = pathElement.getPointAtLength(progress * totalLength);

      group.setAttribute('transform', `translate(${point.x}, ${point.y})`);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        if (group.parentNode) group.parentNode.removeChild(group);
      }
    };

    requestAnimationFrame(frame);
  }

  // Telemetry Log Entry
  logTelemetry(message, type = 'system') {
    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-msg">${message}</span>`;

    this.dom.telemetryLog.appendChild(entry);
    this.dom.telemetryLog.scrollTop = this.dom.telemetryLog.scrollHeight;
  }

  // Helper: realistic pseudo-MD5 hash
  generatePseudoMD5() {
    let hash = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < 32; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  // Helper: Calculate delay scaled by simulation speed (e.g. 0.25x = 4x longer duration)
  scaledDelay(ms) {
    return Math.max(16, Math.round(ms / (this.speed || 0.25)));
  }

  // ============================================================================
  // Simulation Execution Lifecycle
  // ============================================================================

  async startSimulation() {
    if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.updateUI();
      this.logTelemetry('Upload session resumed.', 'system');
      this.runWorkerLoop();
      return;
    }

    if (this.status === 'RUNNING') return;

    this.status = 'INITIATING';
    this.startTime = Date.now();
    this.updateUI();

    // Step 1: Handshake with Auth Server
    this.dom.nodeClient.classList.add('active-node');
    this.logTelemetry(`[CLIENT] Initiating upload request for ${this.fileSizeMB} MB file (${this.mimeType})...`, 'init');
    this.animateSvgPacket(this.dom.pathClientToAuth, 'POST /initiate', '#818cf8', this.scaledDelay(700));

    await this.sleep(this.scaledDelay(750));
    this.dom.nodeAuth.classList.add('active-node');

    // Create random UploadId
    this.uploadId = 'mp_' + Math.random().toString(36).substring(2, 12).toUpperCase();
    this.dom.nodeAuthUploadId.textContent = this.uploadId;
    this.logTelemetry(`[AUTH] S3 CreateMultipartUpload succeeded. UploadId: "${this.uploadId}".`, 'init');

    // Send UploadId back to client
    this.animateSvgPacket(this.dom.pathClientToAuth, 'UploadId: ' + this.uploadId.slice(0, 8), '#06b6d4', this.scaledDelay(700));
    await this.sleep(this.scaledDelay(700));

    this.dom.nodeClientCache.textContent = `IndexedDB (Saved: ${this.uploadId.slice(0, 8)}...)`;
    this.dom.nodeClientSlicing.textContent = `${this.chunks.length} parts ready`;

    // S3 ready
    this.status = 'RUNNING';
    this.updateUI();
    this.logTelemetry(`[CLIENT] Session established. Beginning concurrent chunk transfer with ${this.concurrency} streams...`, 'system');

    // Launch concurrent workers
    this.runWorkerLoop();
  }

  togglePause() {
    if (this.status === 'RUNNING') {
      this.status = 'PAUSED';
      this.updateUI();
      this.logTelemetry('Upload paused by user. Active chunk workers safely yielding.', 'warn');
    } else if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.updateUI();
      this.logTelemetry('Upload resumed.', 'system');
      this.runWorkerLoop();
    }
  }

  stepForward() {
    if (this.status === 'IDLE') {
      this.startSimulation();
      return;
    }
    this.stepMode = true;
    if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.updateUI();
    }
    this.runWorkerLoop();
  }

  injectDrop() {
    this.injectDropNext = true;
    this.logTelemetry('⚠️ FAILURE ARMED: The next in-flight chunk will simulate a network socket drop to demonstrate auto-retry!', 'warn');
  }

  abortSimulation() {
    if (this.status === 'IDLE' || this.status === 'COMPLETED') return;

    this.status = 'ABORTED';
    this.updateUI();
    this.logTelemetry(`[CLIENT] Abort requested. Calling S3 AbortMultipartUpload for session "${this.uploadId}"...`, 'error');

    // Visual cleanup
    this.dom.storageStagingVisual.innerHTML = '<span class="staging-empty">Session aborted: Staged chunks purged</span>';
    this.dom.nodeStoragePartsCount.textContent = '0 parts (Purged)';
    this.dom.nodeClientWorkers.textContent = '0 active';
    this.renderWorkerSlots();
  }

  resetSimulation() {
    this.status = 'IDLE';
    this.uploadId = null;
    this.chunks = [];
    this.activeWorkers = 0;
    this.retriesCount = 0;
    this.uploadedBytes = 0;
    this.injectDropNext = false;
    this.stepMode = false;

    // Reset DOM
    this.dom.nodeClient.classList.remove('active-node');
    this.dom.nodeAuth.classList.remove('active-node');
    this.dom.nodeStorage.classList.remove('active-node');

    this.dom.nodeAuthUploadId.textContent = 'None';
    this.dom.nodeAuthPresignedCount.textContent = '0 issued';
    this.dom.nodeStoragePartsCount.textContent = '0 parts';
    this.dom.nodeStorageFinalETag.textContent = 'Pending';
    this.dom.storageStagingVisual.innerHTML = '<span class="staging-empty">No chunks staged</span>';
    this.dom.nodeClientSlicing.textContent = 'Blob.slice() ready';
    this.dom.nodeClientCache.textContent = 'IndexedDB (Idle)';

    this.buildChunkManifest();
    this.renderChunksGrid();
    this.renderWorkerSlots();
    this.updateUI();
    this.logTelemetry('Simulator reset to initial state.', 'system');
  }

  // ============================================================================
  // Worker Pool Engine
  // ============================================================================

  async runWorkerLoop() {
    if (this.status !== 'RUNNING') return;

    // Check if everything completed
    const pendingOrUploading = this.chunks.filter((c) => c.status !== 'completed');
    if (pendingOrUploading.length === 0) {
      this.completeUpload();
      return;
    }

    // Spawn available workers up to concurrency limit
    for (let slot = 0; slot < this.concurrency; slot++) {
      if (this.activeWorkers < this.concurrency) {
        // Find next chunk that is pending or ready to retry
        const nextChunk = this.chunks.find((c) => c.status === 'pending' || c.status === 'retry');
        if (nextChunk) {
          this.activeWorkers++;
          this.executeChunkUpload(nextChunk, slot);
          if (this.stepMode) break; // Execute only 1 in step mode
        }
      }
    }

    if (this.stepMode) {
      this.stepMode = false;
      this.status = 'PAUSED';
      this.updateUI();
    }
  }

  async executeChunkUpload(chunk, slotIndex) {
    if (this.status !== 'RUNNING') {
      this.activeWorkers--;
      this.updateWorkerSlot(slotIndex, false);
      return;
    }

    // Step 2 & 3: Slice and Presign
    chunk.status = 'slicing';
    this.updateChunkItemUI(chunk);
    this.updateWorkerSlot(slotIndex, true, `Part #${chunk.partNumber}`);
    this.dom.nodeClientWorkers.textContent = `${this.activeWorkers} / ${this.concurrency} active`;

    // Presign URL simulation
    chunk.presignedUrl = `https://s3.amazonaws.com/prod-media-vault/video.mp4?partNumber=${chunk.partNumber}&uploadId=${this.uploadId}`;
    this.dom.nodeAuthPresignedCount.textContent = `${this.chunks.filter((c) => c.presignedUrl).length} issued`;

    // Slicing latency (visual indicator of in-browser memory slicing)
    await this.sleep(this.scaledDelay(240));

    // Step 4: Stream binary directly to S3
    chunk.status = 'uploading';
    this.updateChunkItemUI(chunk);
    this.logTelemetry(`[STREAM ${slotIndex + 1}] PUT partNumber=${chunk.partNumber} (${chunk.sizeMB} MB) to S3...`, 'put');

    // Visual animated packet to storage
    this.animateSvgPacket(this.dom.pathClientToStorage, `PUT #${chunk.partNumber}`, '#10b981', this.scaledDelay(850));

    // Network latency calculation
    const netProfile = NETWORK_PROFILES[this.networkKey];
    const rawDuration = netProfile.baseDelay + (Math.random() * netProfile.jitter);

    // Check if network failure occurs
    let shouldFail = false;
    if (this.injectDropNext) {
      shouldFail = true;
      this.injectDropNext = false;
    } else if (Math.random() < netProfile.dropRate && chunk.attempts < 2) {
      shouldFail = true;
    }

    // Chunk progress animation ticks (15 smooth steps, paced by current simulation speed)
    const steps = 15;
    for (let s = 1; s <= steps; s++) {
      if (this.status !== 'RUNNING') break;
      
      // Compute tick delay dynamically so mid-flight speed adjustments take effect instantly
      const tickDelay = Math.max(25, (rawDuration / steps) / (this.speed || 0.25));
      await this.sleep(tickDelay);

      if (shouldFail && s >= 8) {
        // Trigger simulated failure mid-way
        break;
      }

      chunk.progress = Math.min(100, Math.round((s / steps) * 100));
      this.updateChunkItemUI(chunk);
      this.updateStats();
    }

    if (this.status !== 'RUNNING') {
      this.activeWorkers--;
      this.updateWorkerSlot(slotIndex, false);
      return;
    }

    // Handle Failure vs Success
    if (shouldFail) {
      chunk.attempts++;
      chunk.status = 'retry';
      chunk.progress = 0;
      this.retriesCount++;
      this.updateChunkItemUI(chunk);
      this.logTelemetry(`[DROP] Network glitch on Part #${chunk.partNumber}! S3 stream interrupted. Retry #${chunk.attempts}/3 scheduled...`, 'error');

      await this.sleep(this.scaledDelay(500)); // Backoff before freeing worker
      this.activeWorkers--;
      this.updateWorkerSlot(slotIndex, false);
      this.updateStats();

      // Trigger next cycle
      setTimeout(() => this.runWorkerLoop(), this.scaledDelay(350));
      return;
    }

    // Success! Received ETag from S3
    chunk.status = 'completed';
    chunk.progress = 100;
    chunk.eTag = this.generatePseudoMD5();
    chunk.latencyMs = Math.round(rawDuration);
    this.updateChunkItemUI(chunk);

    // Add mini staged part inside S3 node
    this.addStorageStagedPart(chunk.partNumber);
    this.logTelemetry(`[S3 200 OK] Part #${chunk.partNumber} saved. ETag: "${chunk.eTag}".`, 'etag');

    this.activeWorkers--;
    this.updateWorkerSlot(slotIndex, false);
    this.updateStats();

    // Loop again
    this.runWorkerLoop();
  }

  addStorageStagedPart(partNumber) {
    const emptyNotice = this.dom.storageStagingVisual.querySelector('.staging-empty');
    if (emptyNotice) emptyNotice.remove();

    const mini = document.createElement('div');
    mini.className = 'mini-staged-part';
    mini.title = `Staged Part #${partNumber}`;
    this.dom.storageStagingVisual.appendChild(mini);

    const completedCount = this.chunks.filter((c) => c.status === 'completed').length;
    this.dom.nodeStoragePartsCount.textContent = `${completedCount} / ${this.chunks.length} parts`;
  }

  // Step 5: Final CompleteMultipartUpload
  async completeUpload() {
    this.status = 'ASSEMBLING';
    this.updateUI();

    this.logTelemetry('[CLIENT] All parts uploaded. Compiling CompleteMultipartUpload XML manifest...', 'system');
    await this.sleep(this.scaledDelay(700));

    this.dom.nodeStorage.classList.add('active-node');
    this.animateSvgPacket(this.dom.pathClientToStorage, 'CompleteManifest', '#fbbf24', this.scaledDelay(950));
    this.logTelemetry('[S3] Stitching chunks into final contiguous object & validating compound checksum...', 'complete');

    await this.sleep(this.scaledDelay(1400));

    const finalCompoundETag = `"${this.generatePseudoMD5()}-${this.chunks.length}"`;
    this.dom.nodeStorageFinalETag.textContent = finalCompoundETag;
    this.status = 'COMPLETED';
    this.updateUI();

    this.logTelemetry(`🎉 [SUCCESS] Object assembled! Final Compound ETag: ${finalCompoundETag}. File is live in s3://prod-media-vault!`, 'complete');
  }

  updateChunkItemUI(chunk) {
    const el = document.getElementById(`chunk-item-${chunk.partNumber}`);
    if (el) {
      el.className = `chunk-item ${chunk.status}`;
      el.style.setProperty('--chunk-progress', `${chunk.progress}%`);
    }
  }

  updateStats() {
    let completedBytes = 0;
    let completedParts = 0;

    this.chunks.forEach((c) => {
      if (c.status === 'completed') {
        completedBytes += c.sizeBytes;
        completedParts++;
      } else if (c.status === 'uploading') {
        completedBytes += (c.sizeBytes * (c.progress / 100));
      }
    });

    const totalBytes = this.fileSizeMB * 1024 * 1024;
    const percent = Math.min(100, Math.round((completedBytes / totalBytes) * 100));

    this.dom.overallProgressBar.style.width = `${percent}%`;
    this.dom.overallPercent.textContent = `${percent}%`;

    const uploadedMB = (completedBytes / (1024 * 1024)).toFixed(1);
    this.dom.statUploadedBytes.textContent = `${uploadedMB} MB / ${this.fileSizeMB} MB`;
    this.dom.statCompletedParts.textContent = `${completedParts} / ${this.chunks.length}`;
    this.dom.statRetries.textContent = this.retriesCount;

    // Transfer speed approximation (scaled to simulated real-world throughput)
    if (this.status === 'RUNNING' && this.startTime) {
      const elapsedSec = (Date.now() - this.startTime) / 1000;
      if (elapsedSec > 0.5) {
        const speed = ((uploadedMB / elapsedSec) * (1 / (this.speed || 0.25))).toFixed(1);
        this.dom.statSpeed.textContent = `${speed} MB/s`;
      }
    } else if (this.status === 'COMPLETED' || this.status === 'IDLE') {
      this.dom.statSpeed.textContent = '0 MB/s';
    }
  }

  updateUI() {
    // Status Indicator
    this.dom.simStatusDot.className = 'status-dot';
    switch (this.status) {
      case 'IDLE':
        this.dom.simStatusLabel.textContent = 'Status: Ready to Upload';
        this.dom.startBtn.disabled = false;
        this.dom.pauseBtn.disabled = true;
        this.dom.failNextBtn.disabled = true;
        this.dom.abortBtn.disabled = true;
        this.dom.stepBtn.disabled = false;
        break;
      case 'INITIATING':
        this.dom.simStatusDot.classList.add('active');
        this.dom.simStatusLabel.textContent = 'Status: Initiating S3 Handshake...';
        this.dom.startBtn.disabled = true;
        this.dom.pauseBtn.disabled = true;
        this.dom.failNextBtn.disabled = true;
        this.dom.abortBtn.disabled = false;
        break;
      case 'RUNNING':
        this.dom.simStatusDot.classList.add('active');
        this.dom.simStatusLabel.textContent = 'Status: Streaming Chunks Concurrently';
        this.dom.startBtn.disabled = true;
        this.dom.pauseBtn.disabled = false;
        this.dom.pauseBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg> Pause
        `;
        this.dom.failNextBtn.disabled = false;
        this.dom.abortBtn.disabled = false;
        break;
      case 'PAUSED':
        this.dom.simStatusDot.classList.add('paused');
        this.dom.simStatusLabel.textContent = 'Status: Paused';
        this.dom.startBtn.disabled = true;
        this.dom.pauseBtn.disabled = false;
        this.dom.pauseBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg> Resume
        `;
        this.dom.failNextBtn.disabled = true;
        this.dom.abortBtn.disabled = false;
        break;
      case 'ASSEMBLING':
        this.dom.simStatusDot.classList.add('active');
        this.dom.simStatusLabel.textContent = 'Status: Stitching S3 Blocks...';
        this.dom.startBtn.disabled = true;
        this.dom.pauseBtn.disabled = true;
        this.dom.failNextBtn.disabled = true;
        this.dom.abortBtn.disabled = true;
        break;
      case 'COMPLETED':
        this.dom.simStatusDot.classList.add('active');
        this.dom.simStatusLabel.textContent = 'Status: Upload Completed Successfully!';
        this.dom.startBtn.disabled = true;
        this.dom.pauseBtn.disabled = true;
        this.dom.failNextBtn.disabled = true;
        this.dom.abortBtn.disabled = true;
        this.dom.stepBtn.disabled = true;
        break;
      case 'ABORTED':
        this.dom.simStatusDot.classList.add('error');
        this.dom.simStatusLabel.textContent = 'Status: Upload Session Aborted';
        this.dom.startBtn.disabled = true;
        this.dom.pauseBtn.disabled = true;
        this.dom.failNextBtn.disabled = true;
        this.dom.abortBtn.disabled = true;
        this.dom.stepBtn.disabled = true;
        break;
    }
  }

  openChunkModal(partNumber) {
    const chunk = this.chunks.find((c) => c.partNumber === partNumber);
    if (!chunk) return;

    this.dom.modalPartBadge.textContent = `Part #${chunk.partNumber}`;
    this.dom.modalPartTitle.textContent = `Chunk #${chunk.partNumber} Metadata`;

    const statusBadgeClass = chunk.status === 'completed' ? 'text-success' : chunk.status === 'retry' ? 'text-danger' : 'text-accent';

    this.dom.modalBody.innerHTML = `
      <div class="modal-row">
        <span class="modal-key">State:</span>
        <span class="modal-val ${statusBadgeClass}">${chunk.status.toUpperCase()}</span>
      </div>
      <div class="modal-row">
        <span class="modal-key">Byte Range (Offset):</span>
        <span class="modal-val">${chunk.start.toLocaleString()} - ${chunk.end.toLocaleString()} bytes</span>
      </div>
      <div class="modal-row">
        <span class="modal-key">Chunk Payload Size:</span>
        <span class="modal-val">${chunk.sizeMB} MB (${chunk.sizeBytes.toLocaleString()} B)</span>
      </div>
      <div class="modal-row">
        <span class="modal-key">S3 Checksum / ETag:</span>
        <span class="modal-val">${chunk.eTag ? `"${chunk.eTag}"` : '<span class="text-muted">Awaiting Upload</span>'}</span>
      </div>
      <div class="modal-row">
        <span class="modal-key">Transfer Latency:</span>
        <span class="modal-val">${chunk.latencyMs ? `${chunk.latencyMs} ms` : '-'}</span>
      </div>
      <div class="modal-row">
        <span class="modal-key">Retry Attempts:</span>
        <span class="modal-val ${chunk.attempts > 0 ? 'text-warning' : ''}">${chunk.attempts}</span>
      </div>
      <div class="modal-row" style="flex-direction: column; gap: 0.25rem;">
        <span class="modal-key">Target S3 Presigned URL:</span>
        <code style="word-break: break-all; font-size: 0.72rem; padding: 0.4rem; background: rgba(0,0,0,0.3);">${chunk.presignedUrl || 'Presigned URL will be generated upon slicing'}</code>
      </div>
    `;

    this.dom.chunkModal.classList.remove('hidden');
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// 3. Head-to-Head Comparison Race Simulator
// ============================================================================

class ComparisonRaceManager {
  constructor() {
    this.singleBar = document.getElementById('singleProgressBar');
    this.singlePercent = document.getElementById('singlePercent');
    this.singleBytes = document.getElementById('singleBytes');
    this.singleStateText = document.getElementById('singleStateText');
    this.singleOutcome = document.getElementById('singleOutcome');
    this.singleFailCallout = document.getElementById('singleFailCallout');

    this.multiBar = document.getElementById('multiProgressBar');
    this.multiPercent = document.getElementById('multiPercent');
    this.multiBytes = document.getElementById('multiBytes');
    this.multiStateText = document.getElementById('multiStateText');
    this.multiOutcome = document.getElementById('multiOutcome');
    this.multiSuccessCallout = document.getElementById('multiSuccessCallout');

    this.startBtn = document.getElementById('startRaceBtn');
    this.disruptBtn = document.getElementById('disruptRaceBtn');
    this.resetBtn = document.getElementById('resetRaceBtn');

    this.totalMB = 5000;
    this.singleProgress = 0;
    this.multiProgress = 0;
    this.isRunning = false;
    this.disrupted = false;
    this.timerId = null;

    this.init();
  }

  init() {
    this.startBtn.addEventListener('click', () => this.startRace());
    this.disruptBtn.addEventListener('click', () => this.triggerDisruption());
    this.resetBtn.addEventListener('click', () => this.resetRace());
  }

  startRace() {
    if (this.isRunning) return;

    this.resetRace();
    this.isRunning = true;
    this.startBtn.disabled = true;
    this.disruptBtn.disabled = false;

    this.singleStateText.textContent = 'Streaming Single HTTP PUT...';
    this.multiStateText.textContent = 'Streaming 4 Concurrent Parts...';

    const interval = 80;

    this.timerId = setInterval(() => {
      // Advance Single (slower, single TCP connection)
      if (this.singleProgress < 100 && !this.disrupted) {
        this.singleProgress += 0.8;
      }

      // Advance Multi (faster parallelism)
      if (this.multiProgress < 100) {
        this.multiProgress += 1.4;
      }

      // Automatic disruption around 78% if user hasn't clicked
      if (!this.disrupted && (this.singleProgress >= 78 || this.multiProgress >= 78)) {
        this.triggerDisruption();
      }

      this.updateRaceUI();

      // Check race finish
      if (this.multiProgress >= 100 && (this.disrupted || this.singleProgress >= 100)) {
        clearInterval(this.timerId);
        this.isRunning = false;
        this.disruptBtn.disabled = true;
        this.multiStateText.textContent = 'Finished';
        this.multiOutcome.textContent = 'Complete (Resilient)';
        this.multiOutcome.className = 'text-success';
        this.multiSuccessCallout.classList.remove('hidden');
      }
    }, interval);
  }

  triggerDisruption() {
    if (this.disrupted) return;
    this.disrupted = true;
    this.disruptBtn.disabled = true;

    // Single upload crashes completely back to 0!
    this.singleStateText.textContent = 'Connection Dropped! Resetting to 0%...';
    this.singleOutcome.textContent = 'Fatal Error (0% Kept)';
    this.singleOutcome.className = 'text-danger';
    this.singleFailCallout.classList.remove('hidden');

    // Simulate single dropping to 0
    this.singleProgress = 0;
    this.singleBar.style.width = '0%';
    this.singlePercent.textContent = '0%';
    this.singleBytes.textContent = '0 / 5,000 MB';

    // Multipart upload only drops the single active chunk (subtract ~2%) and recovers
    this.multiStateText.textContent = 'Part #16 dropped! Retrying chunk #16...';
    this.multiProgress = Math.max(0, this.multiProgress - 2.5);
  }

  updateRaceUI() {
    // Single
    const sP = Math.min(100, Math.round(this.singleProgress));
    this.singleBar.style.width = `${sP}%`;
    this.singlePercent.textContent = `${sP}%`;
    const sBytes = Math.round((sP / 100) * this.totalMB);
    this.singleBytes.textContent = `${sBytes} / ${this.totalMB} MB`;

    // Multi
    const mP = Math.min(100, Math.round(this.multiProgress));
    this.multiBar.style.width = `${mP}%`;
    this.multiPercent.textContent = `${mP}%`;
    const mBytes = Math.round((mP / 100) * this.totalMB);
    this.multiBytes.textContent = `${mBytes} / ${this.totalMB} MB`;
  }

  resetRace() {
    clearInterval(this.timerId);
    this.isRunning = false;
    this.disrupted = false;
    this.singleProgress = 0;
    this.multiProgress = 0;

    this.startBtn.disabled = false;
    this.disruptBtn.disabled = true;

    this.singleBar.style.width = '0%';
    this.singlePercent.textContent = '0%';
    this.singleBytes.textContent = '0 / 5,000 MB';
    this.singleStateText.textContent = 'Idle';
    this.singleOutcome.textContent = 'Awaiting start';
    this.singleOutcome.className = 'text-muted';
    this.singleFailCallout.classList.add('hidden');

    this.multiBar.style.width = '0%';
    this.multiPercent.textContent = '0%';
    this.multiBytes.textContent = '0 / 5,000 MB';
    this.multiStateText.textContent = 'Idle';
    this.multiOutcome.textContent = 'Awaiting start';
    this.multiOutcome.className = 'text-muted';
    this.multiSuccessCallout.classList.add('hidden');
  }
}

// ============================================================================
// 4. Code Tabs & Copy Manager
// ============================================================================

class CodeTabsManager {
  constructor() {
    this.tabs = document.querySelectorAll('.code-tab');
    this.contents = document.querySelectorAll('.code-tab-content');
    this.copyBtn = document.getElementById('copyCodeBtn');
    this.copyText = document.getElementById('copyCodeText');

    this.init();
  }

  init() {
    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');

        this.tabs.forEach((t) => t.classList.remove('active'));
        this.contents.forEach((c) => c.classList.remove('active'));

        tab.classList.add('active');
        const activeContent = document.getElementById(`tab-${target}`);
        if (activeContent) activeContent.classList.add('active');
      });
    });

    this.copyBtn.addEventListener('click', () => {
      const activeContent = document.querySelector('.code-tab-content.active code');
      if (activeContent) {
        navigator.clipboard.writeText(activeContent.textContent).then(() => {
          this.copyText.textContent = 'Copied!';
          setTimeout(() => {
            this.copyText.textContent = 'Copy Code';
          }, 2000);
        });
      }
    });
  }
}

// ============================================================================
// 5. Quiz Engine
// ============================================================================

class QuizEngine {
  constructor() {
    this.cards = document.querySelectorAll('.quiz-card');
    this.scoreBadge = document.getElementById('quizScoreBadge');
    this.score = 0;
    this.total = this.cards.length;

    this.explanations = {
      1: 'S3 multipart upload ETags append "-N" where N is the total number of chunks. Because S3 calculates the compound ETag by hashing the concatenated binary MD5 hashes of each chunk rather than the entire raw file, the count suffix distinguishes it from standard single-PUT MD5s.',
      2: 'AWS S3 strictly enforces a 5 MB (5,242,880 bytes) minimum part size for every part except the final chunk. Attempting to upload a non-final part smaller than 5 MB results in an EntityTooSmall error.',
      3: 'Direct-to-S3 uploads via Presigned URLs offload gigabytes of streaming I/O from your API servers to S3 edge storage. Your server handles zero file bytes, eliminating bandwidth costs and CPU/RAM exhaustion.',
      4: 'Incomplete multipart parts are hidden from standard S3 bucket listings yet incur regular S3 storage charges! Configuring an S3 Lifecycle Rule to "AbortIncompleteMultipartUpload" after 7 days automatically cleans up abandoned chunks.'
    };

    this.init();
  }

  init() {
    this.cards.forEach((card) => {
      const qNum = card.getAttribute('data-question');
      const options = card.querySelectorAll('.quiz-opt');
      const feedback = card.querySelector('.quiz-feedback');

      options.forEach((opt) => {
        opt.addEventListener('click', () => {
          if (card.classList.contains('answered')) return;
          card.classList.add('answered');

          const isCorrect = opt.getAttribute('data-correct') === 'true';

          options.forEach((o) => {
            o.disabled = true;
            if (o.getAttribute('data-correct') === 'true') {
              o.classList.add('correct');
            }
          });

          if (isCorrect) {
            opt.classList.add('correct');
            this.score++;
            feedback.className = 'quiz-feedback success';
            feedback.innerHTML = `<strong>Correct!</strong> ${this.explanations[qNum]}`;
          } else {
            opt.classList.add('incorrect');
            feedback.className = 'quiz-feedback error';
            feedback.innerHTML = `<strong>Incorrect.</strong> ${this.explanations[qNum]}`;
          }

          feedback.classList.remove('hidden');
          this.scoreBadge.textContent = `Score: ${this.score} / ${this.total}`;
          if (this.score === this.total) {
            this.scoreBadge.style.borderColor = 'var(--success)';
            this.scoreBadge.style.color = 'var(--success)';
          }
        });
      });
    });
  }
}

// ============================================================================
// 6. Theme Toggle & Scroll Spy
// ============================================================================

function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('multipart_theme') || 'dark';

  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  }

  toggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('light-theme')) {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('multipart_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('multipart_theme', 'light');
    }
  });
}

function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ============================================================================
// 7. Initialization on DOM Loaded
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupScrollSpy();

  // Instantiate Modules
  window.multipartSim = new MultipartSimulator();
  window.comparisonRace = new ComparisonRaceManager();
  window.codeTabs = new CodeTabsManager();
  window.quizEngine = new QuizEngine();
});
