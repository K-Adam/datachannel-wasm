/**
 * Copyright (c) 2017-2022 Paul-Louis Ageneau
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include "candidate.hpp"

#include <sstream>

namespace rtc {

Candidate::Candidate(const string &candidate, const string &mid)
    : mCandidate(candidate), mMid(mid) {}

Candidate::Type Candidate::type() const {
	std::istringstream iss(mCandidate);
	string token;
	while (iss >> token && token != "typ") {
	}
	if (!(iss >> token))
		return Type::Unknown;
	if (token == "host")
		return Type::Host;
	if (token == "srflx")
		return Type::ServerReflexive;
	if (token == "prflx")
		return Type::PeerReflexive;
	if (token == "relay")
		return Type::Relayed;
	return Type::Unknown;
}

string Candidate::candidate() const { return mCandidate; }

string Candidate::mid() const { return mMid; }

Candidate::operator string() const { return "a=" + mCandidate; }

optional<string> Candidate::address() const {
	std::istringstream iss(mCandidate);
	string foundation, component, transport, priority, address;
	if (iss >> foundation >> component >> transport >> priority >> address)
		return address;
	return nullopt;
}

} // namespace rtc

std::ostream &operator<<(std::ostream &out, const rtc::Candidate &candidate) {
	return out << std::string(candidate);
}
