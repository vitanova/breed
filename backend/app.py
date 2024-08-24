from flask import Flask, request, jsonify
from flask_cors import CORS
from itertools import combinations
import itertools
import math


def gen_child_prob(mouse1: list, mouse2: list, targets: list):
    mouse1, mouse2 = tuple(mouse1), tuple(mouse2)
    res = {(gender, A, B, C): 0 for gender in ['m', 'f']
           for A in ['AA', 'Aa', 'aa']
           for B in ['BB', 'Bb', 'bb']
           for C in ['CC', 'Cc', 'cc']}
    if mouse1[0].lower() == mouse2[0].lower():
        return {}
    if mouse1[0].lower() == 'f':
        mouse1, mouse2 = mouse2, mouse1
    for gender in ['m', 'f']:
        for a1, a2 in itertools.product(mouse1[1], mouse2[1]):
            if a1 > a2:
                a1, a2 = a2, a1
            for b1, b2 in itertools.product(mouse1[2], mouse2[2]):
                if b1 > b2:
                    b1, b2 = b2, b1
                for c1, c2 in itertools.product(mouse1[3], mouse2[3]):
                    if c1 > c2:
                        c1, c2 = c2, c1
                    res[(gender, a1 + a2, b1 + b2, c1 + c2)] += 1
    if targets:
        res = {k: v for k, v in res.items() if v > 0 and list(k) in targets}
    else:
        res = {k: v for k, v in res.items() if v > 0}
    total = 2 * 4 * 4 * 4
    sum_target = sum(res.values())
    tsum = f'{sum_target // math.gcd(sum_target, total)}/{total // math.gcd(sum_target, total)}'
    res2 = {k: f'{v // math.gcd(v, total)}/{total // math.gcd(v, total)}' for k, v in res.items()}
    res3 = [dict(gene=list(k), prob=v) for k, v in res2.items()]
    return dict(father=list(mouse1), mother=list(mouse2), childs=res3, sum=tsum)


app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

@app.route('/generate_children', methods=['POST'])
def generate_children():
    data = request.get_json()

    parents = data.get('parents', [])
    targets = data.get('targets', [])

    if len(parents) < 2:
        return jsonify({"error": "At least two parents' genes must be provided"}), 400

    # Pair parents' genes and generate child probabilities using your function
    parent_pairs = list(combinations(parents, 2))
    results = []

    for pair in parent_pairs:
        father, mother = pair
        child_results = gen_child_prob(father, mother, targets)  # Call your function here
        results.append(child_results)  # Append the results for each pair

    return jsonify({"results": results}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
