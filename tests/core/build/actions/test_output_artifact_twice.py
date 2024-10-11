# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under both the MIT license found in the
# LICENSE-MIT file in the root directory of this source tree and the Apache
# License, Version 2.0 found in the LICENSE-APACHE file in the root directory
# of this source tree.

# pyre-strict


from buck2.tests.e2e_util.api.buck import Buck
from buck2.tests.e2e_util.buck_workspace import buck_test


@buck_test()
async def test_output_artifact_twice(buck: Buck) -> None:
    res = await buck.build("root//:test_output_artifact_twice")
    assert (
        res.get_build_report()
        .output_for_target("root//:test_output_artifact_twice")
        .read_text()
        == "green lamp"
    )
