/**
 * Send a special telemetry marker if a note is being created from a Meeting
 * Note. If the current active editor isn't a meeting note, nothing is sent.
 *
 * This functionality can be removed after enough data is collected.
 *
 * @param type - will be attached to the telemetry data payload
 * @returns
 */
export declare function maybeSendMeetingNoteTelemetry(type: string): Promise<void>;
