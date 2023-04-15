export interface LogEntry {
  term: number;
  value: any;
}

type ServerState = "follower" | "candidate" | "leader" | "stopped";

export interface Message {
  from?: number;
  to?: number;
  type?: "RequestVote" | "AppendEntries";
  term: number;
  // when type === RequestVote
  lastLogTerm?: number;
  lastLogIndex?: number;
  granted?: boolean;
  // when type === AppendEntries
  prevIndex?: number;
  prevTerm?: number;
  entries?: LogEntry[];
  commitIndex?: number;

  direction?: "request" | "reply";
  sendTime?: number;
  recvTime?: number;
}

export interface Model {
  messages: Message[];
  servers: Server[];
  time: number;
}

export interface Server {
  commitIndex: number;
  electionAlarm: number;
  heartbeatDue: {
    [key in number]: number;
  };
  id: number;
  log: LogEntry[];
  matchIndex: {
    [key in number]: number;
  };
  nextIndex: {
    [key in number]: number;
  };
  peers: number[];
  rpcDue: {
    [key in number]: number;
  };
  state: ServerState;
  term: number;
  voteGranted: {
    [key in number]: boolean;
  };
  votedFor: number | null;
}
