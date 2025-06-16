承知しました！
手順の流れを **「backend のセットアップ完了 → サーバー起動 → frontend の作業へ」** という順に整理し直します。以下が修正案です。

---

## ⚙️ Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project-root
```

---

### 2. Set Up Backend

#### 2.1 Move to Backend Directory

```bash
cd backend
```

#### 2.2 Copy `.env` File

```bash
cp .env.localsample .env
```

必要に応じて `.env` の値を編集してください。

#### 2.3 Install Dependencies

```bash
yarn install
```

#### 2.4 Start MySQL & phpMyAdmin via Docker Compose

```bash
cd ..
docker compose up -d
```

> ✅ MySQL: `localhost:3306`
> ✅ phpMyAdmin: [http://localhost:3307](http://localhost:3307)
> ログイン情報は `.env` に記載されたDBユーザーを使用してください。

#### 2.5 Start Backend Server

```bash
cd backend
yarn dev
```

---

### 3. Set Up Frontend

#### 3.1 Move to Frontend Directory

```bash
cd ../frontend
```

#### 3.2 Copy `.env` File

```bash
cp .env.localsample .env
```

#### 3.3 Install Dependencies

```bash
yarn install
```

#### 3.4 Start Frontend Server

```bash
yarn dev
```

アプリは [http://localhost:3000](http://localhost:3000) で確認できます（`.env` の `PORT` によって変わる場合あり）。
