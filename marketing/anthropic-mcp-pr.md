# MCP Official Registry — Yayınlama Kılavuzu

Doğru hedef: `modelcontextprotocol/registry` (PR değil, CLI ile publish)
`modelcontextprotocol/servers` reposu yeni server kabul etmiyor.

## Ben Zaten Yaptıklarım

- `package.json`'a `"mcpName": "io.github.fullstackdegen/agent-audit"` eklendi ✅
- `server.json` oluşturuldu ✅

## Senin Yapman Gerekenler (3 komut)

```bash
# 1. mcp-publisher'ı indir (macOS/Linux)
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s)_$(uname -m).tar.gz" | tar xz
sudo mv mcp-publisher /usr/local/bin/

# 2. GitHub hesabınla login ol
mcp-publisher login github

# 3. Yayınla
mcp-publisher publish
```

## Doğrulama

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.fullstackdegen/agent-audit"
```

Çıktıda paketin göründüğünü gördüğünde tamamdır.

## Önemli Not

Yeni versiyon çıkardığında `server.json` ve `package.json`'daki `version`'ı da güncellemeyi unutma.
