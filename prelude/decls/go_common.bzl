# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under both the MIT license found in the
# LICENSE-MIT file in the root directory of this source tree and the Apache
# License, Version 2.0 found in the LICENSE-APACHE file in the root directory
# of this source tree.

# TODO(cjhopman): This was generated by scripts/hacks/rules_shim_with_docs.py,
# but should be manually edited going forward. There may be some errors in
# the generated docs, and so those should be verified to be accurate and
# well-formatted (and then delete this TODO)

load(":common.bzl", "LinkableDepType")

LinkMode = ["internal", "external"]

def _deps_arg():
    return {
        "deps": attrs.list(attrs.dep(), default = [], doc = """
    The set of dependencies of this rule. Currently, this only supports go\\_library rules.
"""),
    }

def _srcs_arg():
    return {
        "srcs": attrs.list(attrs.source(), default = [], doc = """
    The set of source files to be compiled by this rule. .go files will be compiled with the Go
     compiler, .s files will be compiled with the assembler, and everything else is assumed to be
     files that may be `#include`d by the assembler.
"""),
    }

def _package_root_arg():
    return {
        "package_root": attrs.option(attrs.string(), default = None, doc = """
    Sets Go package direactory (relative to BUCK file).
    By default (or if None passes) package_root is being detected automatically.
    Empty string of Go package is on the same level as BUCK file otherwise the subdirectory name.
    Example for srcs = ["foo/bar.go"], package_root = "foo"
"""),
    }

def _link_style_arg():
    return {
        "link_style": attrs.option(attrs.enum(LinkableDepType), default = None, doc = """
    Determines whether to build and link this rule's dependencies statically or dynamically. Can be
     one of the following values: `static`, `static_pic` or `shared`.
     This argument is relevant only if the cgo extension is enabled. Otherwise, Buck ignores this argument.
"""),
    }

def _link_mode_arg():
    return {
        "link_mode": attrs.option(attrs.enum(LinkMode), default = None, doc = """
    Determines the link mode (equivalent of `-mode`). Can be one of the following
     values: `internal`, `external`.
     If no value is provided, the mode is set automatically depending on the other args.
"""),
    }

def _cgo_compiler_flags_arg():
    return {
        "cgo_compiler_flags": attrs.list(attrs.string(), default = [], doc = """
    The set of additional compiler flags to pass to `go tool cgo`.
"""),
    }

def _package_name_arg():
    return {
        "package_name": attrs.option(attrs.string(), default = None, doc = """
    Sets the full name of the package being compiled. This defaults to the path from the buck root.
     (e.g. given a ./.buckconfig, a rule in ./a/b/BUCK defaults to package "a/b")
"""),
    }

def _compiler_flags_arg():
    return {
        "compiler_flags": attrs.list(attrs.string(), default = [], doc = """
    The set of additional compiler flags to pass to `go tool compile`.
"""),
    }

def _assembler_flags_arg():
    return {
        "assembler_flags": attrs.list(attrs.string(), default = [], doc = """
    The set of additional assembler flags to pass to `go tool asm`.
"""),
    }

def _linker_flags_arg():
    return {
        "linker_flags": attrs.list(attrs.arg(), default = [], doc = """
    Extra linker flags passed to go link
"""),
    }

def _external_linker_flags_arg():
    return {
        "external_linker_flags": attrs.list(attrs.arg(), default = [], doc = """
    Extra external linker flags passed to go link via `-extld` argument.
     If argument is non-empty or `cgo_library` is used, the link mode
     will switch to `external`.
"""),
    }

def _embedcfg_arg():
    return {
        "embedcfg": attrs.option(attrs.source(), default = None, doc = """
    The embedcfg.json file used by compiler to embed files defined by `//go:embed` directive.
     This generation of this file is included in the `go` toolkit.
     For example:

    ```

    //go:embed *.txt
    var fs embed.FS

    ```
    If the folder contains two files (file1.txt and file2.txt), the embedcfg.json is:

    ```

    {
        "Patterns": {
            "*.txt": ["file1.txt","file2.txt"]
        },
        "Files": {
            "file1.txt": "",
     "file2.txt": ""
     }
    }

    ```
"""),
    }

def _cgo_enabled_arg():
    return {
        "cgo_enabled": attrs.option(attrs.bool(), default = None, doc = """
    Experimental: Analog of CGO_ENABLED environment-variable.
    None will be converted to True if cxx_toolchain available for current configuration, otherwise False.
"""),
    }

def _race_arg():
    return {
        "race": attrs.bool(default = False, doc = """
    If true, enable data race detection.
"""),
    }

def _asan_arg():
    return {
        "asan": attrs.bool(default = False, doc = """
    If true, enable ASAN.
"""),
    }

def _tags_arg():
    return {
        "tags": attrs.list(attrs.string(), default = [], doc = """
    Build tags to apply to this target and its dependencies.
"""),
    }

go_common = struct(
    deps_arg = _deps_arg,
    srcs_arg = _srcs_arg,
    package_root_arg = _package_root_arg,
    link_style_arg = _link_style_arg,
    link_mode_arg = _link_mode_arg,
    cgo_compiler_flags_arg = _cgo_compiler_flags_arg,
    package_name_arg = _package_name_arg,
    compiler_flags_arg = _compiler_flags_arg,
    assembler_flags_arg = _assembler_flags_arg,
    linker_flags_arg = _linker_flags_arg,
    external_linker_flags_arg = _external_linker_flags_arg,
    embedcfg_arg = _embedcfg_arg,
    cgo_enabled_arg = _cgo_enabled_arg,
    race_arg = _race_arg,
    asan_arg = _asan_arg,
    tags_arg = _tags_arg,
)
