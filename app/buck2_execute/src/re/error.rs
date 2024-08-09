/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under both the MIT license found in the
 * LICENSE-MIT file in the root directory of this source tree and the Apache
 * License, Version 2.0 found in the LICENSE-APACHE file in the root directory
 * of this source tree.
 */

use remote_execution::REClientError;
use remote_execution::TCode;

#[derive(Debug, buck2_error::Error)]
#[error("Remote Execution Error on {} for ReSession {}\nError: ({})", .re_action, .re_session_id, .message)]
pub struct RemoteExecutionError {
    re_action: String,
    re_session_id: String,
    pub message: String,
    pub code: TCode,
}

pub(crate) async fn with_error_handler<T>(
    re_action: &str,
    re_session_id: &str,
    result: anyhow::Result<T>,
) -> anyhow::Result<T> {
    match result {
        Ok(val) => Ok(val),
        Err(e) => {
            let code = e
                .downcast_ref::<REClientError>()
                .map(|e| e.code)
                .unwrap_or(TCode::UNKNOWN);

            Err(RemoteExecutionError {
                re_action: re_action.to_owned(),
                re_session_id: re_session_id.to_owned(),
                message: format!("{:#}", e),
                code,
            }
            .into())
        }
    }
}
