import store, { SUMMARY_STYLES } from '../store.js';
import * as storage from '../services/storage.js';
import * as download from '../services/download.js';
import * as audio from '../services/audio.js';

export default {
  name: 'HomeView',
  unmounted() {
    if (this.store.isRecording) {
      this.store.isRecording = false;
      this.store.recordSeconds = 0;
      audio.stopRecording();
    }
  },
  data() {
    return {
      store,
      storage,
      styles: SUMMARY_STYLES
    };
  },
  methods: {
    // クリップボードからのテキスト貼り付け
    async handlePaste() {
      try {
        const text = await navigator.clipboard.readText();
        this.store.inputText = text;
        this.store.setDraft();
      } catch (err) {
        this.store.showToast('クリップボードの読み取りに失敗しました', 'danger');
      }
    },
    // 要約結果のクリップボードコピー
    async handleCopy() {
      if (!this.store.resultText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(this.store.resultText);
        this.store.showToast('コピーしました', 'success');
      } catch (err) {
        this.store.showToast('クリップボードへのコピーに失敗しました', 'danger');
      }
    },
    // テキスト形式でダウンロード
    downloadText() {
      if (!this.store.resultText) {
        return;
      }
      download.downloadTextFile('summary.txt', this.store.resultText);
      this.store.showToast('テキストファイルをダウンロードしました', 'success');
    },
    // PDF形式で印刷・保存
    downloadPdf() {
      if (!this.store.resultText) {
        return;
      }
      download.printAsPdf();
    }
  },
  unmounted() {
    if (this.store.isRecording) {
      this.store.cancelRecording();
    }
  },
  template: `
    <div class="container-fluid p-0">
      <div class="row g-3 g-md-4">
        <!-- 左上 入力エリア (col-12 col-lg-8) -->
        <div class="col-12 col-lg-8 d-print-none">
          <div class="card h-100 shadow-sm border">
            <div class="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
              <h5 class="mb-0 fw-semibold">入力</h5>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary d-flex align-items-center"
                @click="handlePaste"
                :disabled="store.isSummarizing"
              >
                <i class="bi bi-clipboard me-1"></i>貼り付け
              </button>
            </div>
            <div class="card-body d-flex flex-column">
              <div class="mb-3 flex-grow-1">
                <textarea
                  class="form-control"
                  rows="8"
                  placeholder="入力するか、左下の録音から文字起こししてください…"
                  v-model="store.inputText"
                  @input="store.setDraft()"
                  :disabled="store.isSummarizing"
                ></textarea>
              </div>
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div class="d-flex align-items-center flex-wrap gap-2">
                  <span class="text-muted small">{{ store.inputText.length }}文字</span>
                  <div class="d-inline-flex align-items-center ms-2">
                    <button
                      v-if="!store.isRecording"
                      type="button"
                      class="btn btn-outline-danger btn-sm d-flex align-items-center"
                      @click="store.startRecording()"
                      :disabled="store.isSummarizing || store.isTranscribing"
                    >
                      <i class="bi bi-record-circle me-1"></i>録音
                    </button>
                    <template v-else>
                      <button
                        type="button"
                        class="btn btn-danger btn-sm d-flex align-items-center"
                        @click="store.stopRecordingAndTranscribe()"
                      >
                        <i class="bi bi-stop-circle me-1"></i>停止
                      </button>
                      <span class="badge bg-secondary ms-2 font-monospace">{{ store.formattedRecordTime }}</span>
                    </template>
                    <div v-if="store.isTranscribing" class="d-inline-flex align-items-center ms-2">
                      <span class="spinner-border spinner-border-sm text-primary me-1" role="status" aria-hidden="true"></span>
                      <span class="text-muted small">文字起こし中...</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-primary px-4 fw-semibold d-flex align-items-center"
                  :disabled="!store.inputText.trim() || store.isSummarizing || store.isRecording || store.isTranscribing"
                  @click="store.executeSummarize()"
                >
                  <span v-if="store.isSummarizing" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  <span v-if="store.isSummarizing">要約中...</span>
                  <span v-else><i class="bi bi-send me-1"></i>要約</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右上 要約スタイル選択エリア (col-12 col-lg-4) -->
        <div class="col-12 col-lg-4 d-print-none">
          <div class="card h-100 shadow-sm border">
            <div class="card-header bg-transparent py-3">
              <h5 class="mb-0 fw-semibold">要約スタイル</h5>
            </div>
            <div class="card-body">
              <div class="list-group">
                <div
                  v-for="style in styles"
                  :key="style.id"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center cursor-pointer py-3"
                  :class="{ active: store.selectedStyle === style.id }"
                  @click="store.selectedStyle = style.id; storage.saveSelectedStyle(style.id)"
                  @keydown.enter="store.selectedStyle = style.id; storage.saveSelectedStyle(style.id)"
                  role="button"
                  tabindex="0"
                >
                  <div class="d-flex align-items-center">
                    <i :class="style.icon" class="fs-5 me-2"></i>
                    <span class="fw-medium">{{ style.name }}</span>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm p-1 text-secondary"
                    :class="{ 'text-white': store.selectedStyle === style.id }"
                    @click.stop
                    v-popover
                    :data-bs-content="style.desc"
                    title="スタイル詳細"
                  >
                    <i class="bi bi-info-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下段 要約出力エリア (col-12) -->
        <div class="col-12">
          <div class="card shadow-sm border">
            <div class="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
              <h5 class="mb-0 fw-semibold">要約結果</h5>
              <div class="d-flex align-items-center gap-2 d-print-none">
                <!-- ダウンロードドロップダウン -->
                <div class="dropdown">
                  <button
                    class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center"
                    type="button"
                    id="downloadDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    :disabled="!store.resultText || store.isSummarizing"
                  >
                    <i class="bi bi-download me-1"></i>ダウンロード
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="downloadDropdown">
                    <li>
                      <button class="dropdown-item d-flex align-items-center" type="button" @click="downloadText">
                        <i class="bi bi-file-earmark-text me-2"></i>テキスト (.txt)
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center" type="button" @click="downloadPdf">
                        <i class="bi bi-printer me-2"></i>印刷 / PDF保存 (.pdf)
                      </button>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary d-flex align-items-center"
                  @click="handleCopy"
                  :disabled="!store.resultText"
                >
                  <i class="bi bi-clipboard-check me-1"></i>コピー
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="store.errorMessage" class="alert alert-danger mb-0" role="alert">
                {{ store.errorMessage }}
              </div>
              <div
                v-else
                class="p-3 rounded bg-body-tertiary border"
                style="min-height: 140px; white-space: pre-wrap;"
              >{{ store.resultText || 'ここに要約結果が表示されます…' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
