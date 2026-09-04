export default {
  name: 'AboutView',
  data() {
    return {
      libraries: [
        {
          name: 'Vue.js',
          version: 'v3.5.13',
          license: 'MIT',
          url: 'https://vuejs.org/',
          siteName: 'vuejs.org'
        },
        {
          name: 'Vue Router',
          version: 'v4.4.5',
          license: 'MIT',
          url: 'https://router.vuejs.org/',
          siteName: 'router.vuejs.org'
        },
        {
          name: 'Bootstrap',
          version: 'v5.3.3',
          license: 'MIT',
          url: 'https://getbootstrap.com/',
          siteName: 'getbootstrap.com'
        },
        {
          name: 'Bootstrap Icons',
          version: 'v1.11.3',
          license: 'MIT',
          url: 'https://icons.getbootstrap.com/',
          siteName: 'icons.getbootstrap.com'
        }
      ]
    };
  },
  template: `
    <div class="container-fluid py-2">
      <div class="row">
        <div class="col-12 col-xl-10">
          <div class="card shadow-sm mb-4 border-0">
            <div class="card-body p-4">
              <h2 class="card-title mb-3">
                <app-brand icon-size="fs-2" text-size="fs-3"></app-brand>
              </h2>
              <p class="card-text text-secondary leading-relaxed mb-0">
                テキストや音声入力をAIで素早く要約・文字起こしするシングルページアプリケーション（SPA）です。<br>
                簡潔要約・会議議事録・レポート形式など、用途に応じたスタイルで出力できます。
              </p>
            </div>
          </div>

          <div class="card shadow-sm mb-4 border-0">
            <div class="card-header bg-body-tertiary py-3 border-bottom">
              <h5 class="card-title fw-bold mb-0">使用ライブラリ・オープンソース</h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th scope="col" style="width: 25%;">ライブラリ</th>
                      <th scope="col" style="width: 15%;">バージョン</th>
                      <th scope="col" style="width: 20%;">ライセンス</th>
                      <th scope="col" style="width: 40%;">公式サイト</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="lib in libraries" :key="lib.name">
                      <td class="fw-medium">{{ lib.name }}</td>
                      <td>{{ lib.version }}</td>
                      <td><span class="badge bg-secondary">{{ lib.license }}</span></td>
                      <td>
                        <a :href="lib.url" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                          {{ lib.siteName }} <i class="bi bi-box-arrow-up-right small"></i>
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
