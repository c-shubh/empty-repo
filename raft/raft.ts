import { util } from "./util";
import { Model, Message, Server, LogEntry } from "./types";

const RPC_TIMEOUT = 50000;
const MIN_RPC_LATENCY = 10000;
const MAX_RPC_LATENCY = 15000;
const ELECTION_TIMEOUT = 100000;
const NUM_SERVERS = 5;
const BATCH_SIZE = 1;

const sendMessage = function (model: Model, message: Message) {
  message.sendTime = model.time;
  message.recvTime =
    model.time +
    MIN_RPC_LATENCY +
    Math.random() * (MAX_RPC_LATENCY - MIN_RPC_LATENCY);
  model.messages.push(message);
};

const sendRequest = function (model: Model, request: Message) {
  request.direction = "request";
  sendMessage(model, request);
};

const sendReply = function (model: Model, request: Message, reply: Message) {
  reply.from = request.to;
  reply.to = request.from;
  reply.type = request.type;
  reply.direction = "reply";
  sendMessage(model, reply);
};

const logTerm = function (log: LogEntry[], index: number) {
  if (index < 1 || index > log.length) {
    return 0;
  } else {
    return log[index - 1].term;
  }
};

const makeElectionAlarm = function (now: number) {
  return now + (Math.random() + 1) * ELECTION_TIMEOUT;
};

const stepDown = function (model: Model, server: Server, term: number) {
  server.term = term;
  server.state = "follower";
  server.votedFor = null;
  if (server.electionAlarm <= model.time || server.electionAlarm == util.Inf) {
    server.electionAlarm = makeElectionAlarm(model.time);
  }
};

const handleRequestVoteRequest = function (
  model: Model,
  server: Server,
  request: Message
) {
  if (server.term < request.term) stepDown(model, server, request.term);
  let granted = false;
  if (
    server.term == request.term &&
    (server.votedFor === null || server.votedFor == request.from) &&
    (request.lastLogTerm! > logTerm(server.log, server.log.length) ||
      (request.lastLogTerm == logTerm(server.log, server.log.length) &&
        request.lastLogIndex >= server.log.length))
  ) {
    granted = true;
    server.votedFor = request.from;
    server.electionAlarm = makeElectionAlarm(model.time);
  }
  sendReply(model, request, {
    term: server.term,
    granted: granted,
  });
};

const handleRequestVoteReply = function (model: Model, server: Server, reply) {
  if (server.term < reply.term) stepDown(model, server, reply.term);
  if (server.state == "candidate" && server.term == reply.term) {
    server.rpcDue[reply.from] = util.Inf;
    server.voteGranted[reply.from] = reply.granted;
  }
};

const handleAppendEntriesRequest = function (
  model: Model,
  server: Server,
  request
) {
  let success = false;
  let matchIndex = 0;
  if (server.term < request.term) stepDown(model, server, request.term);
  if (server.term == request.term) {
    server.state = "follower";
    server.electionAlarm = makeElectionAlarm(model.time);
    if (
      request.prevIndex === 0 ||
      (request.prevIndex <= server.log.length &&
        logTerm(server.log, request.prevIndex) == request.prevTerm)
    ) {
      success = true;
      let index = request.prevIndex;
      for (let i = 0; i < request.entries.length; i += 1) {
        index += 1;
        if (logTerm(server.log, index) != request.entries[i].term) {
          while (server.log.length > index - 1) server.log.pop();
          server.log.push(request.entries[i]);
        }
      }
      matchIndex = index;
      server.commitIndex = Math.max(server.commitIndex, request.commitIndex);
    }
  }
  sendReply(model, request, {
    term: server.term,
    success: success,
    matchIndex: matchIndex,
  });
};

const handleAppendEntriesReply = function (
  model: Model,
  server: Server,
  reply
) {
  if (server.term < reply.term) stepDown(model, server, reply.term);
  if (server.state == "leader" && server.term == reply.term) {
    if (reply.success) {
      server.matchIndex[reply.from] = Math.max(
        server.matchIndex[reply.from],
        reply.matchIndex
      );
      server.nextIndex[reply.from] = reply.matchIndex + 1;
    } else {
      server.nextIndex[reply.from] = Math.max(
        1,
        server.nextIndex[reply.from] - 1
      );
    }
    server.rpcDue[reply.from] = 0;
  }
};

const handleMessage = function (
  model: Model,
  server: Server,
  message: Message
) {
  if (server.state == "stopped") return;
  if (message.type == "RequestVote") {
    if (message.direction == "request")
      handleRequestVoteRequest(model, server, message);
    else handleRequestVoteReply(model, server, message);
  } else if (message.type == "AppendEntries") {
    if (message.direction == "request")
      handleAppendEntriesRequest(model, server, message);
    else handleAppendEntriesReply(model, server, message);
  }
};

const rules = {
  startNewElection: function (model: Model, server: Server) {
    if (
      (server.state == "follower" || server.state == "candidate") &&
      server.electionAlarm <= model.time
    ) {
      server.electionAlarm = makeElectionAlarm(model.time);
      server.term += 1;
      server.votedFor = server.id;
      server.state = "candidate";
      server.voteGranted = util.makeMap(server.peers, false);
      server.matchIndex = util.makeMap(server.peers, 0);
      server.nextIndex = util.makeMap(server.peers, 1);
      server.rpcDue = util.makeMap(server.peers, 0);
      server.heartbeatDue = util.makeMap(server.peers, 0);
    }
  },
  sendRequestVote: function (model: Model, server: Server, peer) {
    if (server.state == "candidate" && server.rpcDue[peer] <= model.time) {
      server.rpcDue[peer] = model.time + RPC_TIMEOUT;
      sendRequest(model, {
        from: server.id,
        to: peer,
        type: "RequestVote",
        term: server.term,
        lastLogTerm: logTerm(server.log, server.log.length),
        lastLogIndex: server.log.length,
      });
    }
  },
  becomeLeader: function (model: Model, server: Server) {
    if (
      server.state == "candidate" &&
      util.countTrue(util.mapValues(server.voteGranted)) + 1 >
        Math.floor(NUM_SERVERS / 2)
    ) {
      //console.log('server ' + server.id + ' is leader in term ' + server.term);
      server.state = "leader";
      server.nextIndex = util.makeMap(server.peers, server.log.length + 1);
      server.rpcDue = util.makeMap(server.peers, util.Inf);
      server.heartbeatDue = util.makeMap(server.peers, 0);
      server.electionAlarm = util.Inf;
    }
  },
  sendAppendEntries: function (model: Model, server: Server, peer) {
    if (
      server.state == "leader" &&
      (server.heartbeatDue[peer] <= model.time ||
        (server.nextIndex[peer] <= server.log.length &&
          server.rpcDue[peer] <= model.time))
    ) {
      let prevIndex = server.nextIndex[peer] - 1;
      let lastIndex = Math.min(prevIndex + BATCH_SIZE, server.log.length);
      if (server.matchIndex[peer] + 1 < server.nextIndex[peer])
        lastIndex = prevIndex;
      sendRequest(model, {
        from: server.id,
        to: peer,
        type: "AppendEntries",
        term: server.term,
        prevIndex: prevIndex,
        prevTerm: logTerm(server.log, prevIndex),
        entries: server.log.slice(prevIndex, lastIndex),
        commitIndex: Math.min(server.commitIndex, lastIndex),
      });
      server.rpcDue[peer] = model.time + RPC_TIMEOUT;
      server.heartbeatDue[peer] = model.time + ELECTION_TIMEOUT / 2;
    }
  },
  advanceCommitIndex: function (model: Model, server: Server) {
    let matchIndexes = util
      .mapValues(server.matchIndex)
      .concat(server.log.length);
    matchIndexes.sort(util.numericCompare);
    let n = matchIndexes[Math.floor(NUM_SERVERS / 2)];
    if (server.state == "leader" && logTerm(server.log, n) == server.term) {
      server.commitIndex = Math.max(server.commitIndex, n);
    }
  },
};

const raft = {
  server: function (id: number, peers) {
    return {
      id: id,
      peers: peers,
      state: "follower",
      term: 1,
      votedFor: null,
      log: [],
      commitIndex: 0,
      electionAlarm: makeElectionAlarm(0),
      voteGranted: util.makeMap(peers, false),
      matchIndex: util.makeMap(peers, 0),
      nextIndex: util.makeMap(peers, 1),
      rpcDue: util.makeMap(peers, 0),
      heartbeatDue: util.makeMap(peers, 0),
    };
  },
  update: function (model: Model) {
    model.servers.forEach(function (server) {
      rules.startNewElection(model, server);
      rules.becomeLeader(model, server);
      rules.advanceCommitIndex(model, server);
      server.peers.forEach(function (peer) {
        rules.sendRequestVote(model, server, peer);
        rules.sendAppendEntries(model, server, peer);
      });
    });
    let deliver: any[] = [];
    let keep: any[] = [];
    model.messages.forEach(function (message) {
      if (message.recvTime <= model.time) deliver.push(message);
      else if (message.recvTime < util.Inf) keep.push(message);
    });
    model.messages = keep;
    deliver.forEach(function (message) {
      model.servers.forEach(function (server) {
        if (server.id == message.to) {
          handleMessage(model, server, message);
        }
      });
    });
  },
  stop: function (model: Model, server: Server) {
    server.state = "stopped";
    server.electionAlarm = 0;
  },
  resume: function (model: Model, server: Server) {
    server.state = "follower";
    server.electionAlarm = makeElectionAlarm(model.time);
  },
  resumeAll: function (model: Model) {
    model.servers.forEach(function (server) {
      raft.resume(model, server);
    });
  },
  restart: function (model: Model, server: Server) {
    raft.stop(model, server);
    raft.resume(model, server);
  },
  drop: function (model: Model, message: Message) {
    model.messages = model.messages.filter(function (m) {
      return m !== message;
    });
  },
  timeout: function (model: Model, server: Server) {
    server.state = "follower";
    server.electionAlarm = 0;
    rules.startNewElection(model, server);
  },
  clientRequest: function (model: Model, server: Server) {
    if (server.state == "leader") {
      server.log.push({
        term: server.term,
        value: "v",
      });
    }
  },
  spreadTimers: function (model: Model) {
    let timers: any[] = [];
    model.servers.forEach(function (server) {
      if (
        server.electionAlarm > model.time &&
        server.electionAlarm < util.Inf
      ) {
        timers.push(server.electionAlarm);
      }
    });
    timers.sort(util.numericCompare);
    if (timers.length > 1 && timers[1] - timers[0] < MAX_RPC_LATENCY) {
      if (timers[0] > model.time + MAX_RPC_LATENCY) {
        model.servers.forEach(function (server) {
          if (server.electionAlarm == timers[0]) {
            server.electionAlarm -= MAX_RPC_LATENCY;
            console.log("adjusted S" + server.id + " timeout forward");
          }
        });
      } else {
        model.servers.forEach(function (server) {
          if (
            server.electionAlarm > timers[0] &&
            server.electionAlarm < timers[0] + MAX_RPC_LATENCY
          ) {
            server.electionAlarm += MAX_RPC_LATENCY;
            console.log("adjusted S" + server.id + " timeout backward");
          }
        });
      }
    }
  },
  alignTimers: function (model: Model) {
    raft.spreadTimers(model);
    let timers: any[] = [];
    model.servers.forEach(function (server) {
      if (
        server.electionAlarm > model.time &&
        server.electionAlarm < util.Inf
      ) {
        timers.push(server.electionAlarm);
      }
    });
    timers.sort(util.numericCompare);
    model.servers.forEach(function (server) {
      if (server.electionAlarm == timers[1]) {
        server.electionAlarm = timers[0];
        console.log("adjusted S" + server.id + " timeout forward");
      }
    });
  },
  setupLogReplicationScenario: function (model: Model) {
    let s1 = model.servers[0];
    raft.restart(model, model.servers[1]);
    raft.restart(model, model.servers[2]);
    raft.restart(model, model.servers[3]);
    raft.restart(model, model.servers[4]);
    raft.timeout(model, model.servers[0]);
    rules.startNewElection(model, s1);
    model.servers[1].term = 2;
    model.servers[2].term = 2;
    model.servers[3].term = 2;
    model.servers[4].term = 2;
    model.servers[1].votedFor = 1;
    model.servers[2].votedFor = 1;
    model.servers[3].votedFor = 1;
    model.servers[4].votedFor = 1;
    s1.voteGranted = util.makeMap(s1.peers, true);
    raft.stop(model, model.servers[2]);
    raft.stop(model, model.servers[3]);
    raft.stop(model, model.servers[4]);
    rules.becomeLeader(model, s1);
    raft.clientRequest(model, s1);
    raft.clientRequest(model, s1);
    raft.clientRequest(model, s1);
  },
  rules,
};
