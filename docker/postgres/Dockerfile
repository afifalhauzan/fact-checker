# Same base as before, so an existing pgdata volume keeps its collation; only pgvector is added.
FROM postgres:17-alpine

ARG PGVECTOR_VERSION=0.8.0

# with_llvm=no: the alpine image has no clang/llvm to build JIT bitcode, which pgvector does not need
RUN apk add --no-cache --virtual .build-deps git build-base \
    && git clone --branch v${PGVECTOR_VERSION} --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && make -C /tmp/pgvector with_llvm=no \
    && make -C /tmp/pgvector with_llvm=no install \
    && rm -rf /tmp/pgvector \
    && apk del .build-deps
