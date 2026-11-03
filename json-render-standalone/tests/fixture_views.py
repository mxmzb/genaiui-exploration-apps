"""Deterministic component trees for UI verification, never model-quality evidence."""
import json
import re
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[2] / 'db' / 'apartments.db'


def records():
    with sqlite3.connect(f'file:{DB}?mode=ro', uri=True) as db:
        return [json.loads(r[0]) for r in db.execute('SELECT payload FROM apartments ORDER BY CAST(id AS INTEGER)')]


def view(prompt):
    rows = records()
    by_id = {r['id']: r for r in rows}
    elements = {}

    def node(kind, props=None, children=None, action=None):
        key = f'n{len(elements)}'
        elements[key] = {'type': kind, 'props': props or {}, 'children': children or []}
        if action:
            elements[key]['on'] = {'press': {'action': action[0], 'params': action[1]}}
        return key

    def stack(children, padding='none', gap='md'):
        return node('Stack', {'padding': padding, 'gap': gap}, children)

    def grid(children, columns='2'):
        return node('Grid', {'columns': columns, 'gap': 'lg'}, children)

    def row(children, align='start'):
        return node('Row', {'gap': 'md', 'align': align}, children)

    def text(value, tone='default'):
        return node('Text', {'content': str(value), 'tone': tone})

    def heading(value, level='h3'):
        return node('Heading', {'text': value, 'level': level})

    def metric(label, value, emphasis=False):
        return node('Metric', {'label': label, 'value': str(value), 'emphasis': emphasis})

    def money(value):
        return 'Not supplied' if value is None else f'${value:,}'

    def button(label, action, params=None, variant='secondary'):
        return node('Button', {'label': label, 'variant': variant, 'type': 'button'}, action=(action, params or {}))

    def back():
        return button('Back to Results', 'back_to_results', variant='ghost')

    def photo(r, index=0):
        p = r['photos'][index]
        return node('Image', {'src': p['url'], 'alt': p['alt'], 'aspect': 'landscape'})

    def actions(r):
        return row([button('View Details', 'view_apartment', {'apartmentId': r['id']}, 'primary'), button('Schedule Tour', 'schedule_tour', {'apartmentId': r['id']})])

    def total(r):
        costs = r['costs']
        return metric('Mandatory monthly total' if costs['monthlyTotal'] is not None else 'Known monthly subtotal · incomplete', money(costs['monthlyTotal'] if costs['monthlyTotal'] is not None else costs['knownMonthlySubtotal']) + '/mo', True)

    def card(r, compare=False):
        children = [node('Badge', {'text': r['neighborhood'], 'tone': 'accent'}), heading(r['title']), total(r)]
        if compare:
            children += [metric('Base rent', money(r['rent']) + '/mo'), metric('Required monthly fees', 'Unknown' if r['costs']['monthlyTotal'] is None else money(r['costs']['monthlyTotal'] - r['rent'])), node('Divider'), metric('Space', f"{r['bedrooms']} bed · {r['bathrooms']} bath · {r['sqft']:,} sqft"), metric('Pets', r['petPolicy']), metric('Transit', r['nearbyTransit'][0]), metric('Available from', r['availableFrom'] or 'Not supplied')]
        else:
            children += [row([metric('Bedrooms', 'Studio' if not r['bedrooms'] else r['bedrooms']), metric('Bathrooms', r['bathrooms']), metric('Area', f"{r['sqft']:,} sqft")]), text(r['description'], 'muted')]
        children += [actions(r)]
        inside = stack([photo(r), stack(children, 'md')]) if compare else grid([photo(r), stack(children, 'md')])
        return node('Card', {'recordId': r['id'], 'variant': 'outlined', 'padding': 'none'}, [inside])

    def detail(r):
        gallery = stack([photo(r), grid([photo(r, 1), photo(r, 2)]), text('Illustrative photos · synthetic listing', 'muted')])
        summary = stack([node('Badge', {'text': r['neighborhood'], 'tone': 'accent'}), heading(r['title'], 'h2'), text(r['address'], 'muted'), total(r), row([metric('Bedrooms', r['bedrooms']), metric('Bathrooms', r['bathrooms']), metric('Area', f"{r['sqft']:,} sqft")]), text(r['description']), row([button('Schedule Tour', 'schedule_tour', {'apartmentId': r['id']}, 'primary'), back()])])
        fees = [heading('The cost of moving in'), metric('Base rent', money(r['rent']) + '/mo')]
        fees += [metric(f"{f['label']} · {f['frequency']} · {'required' if f['required'] else 'optional'}", money(f['amount'])) for f in r['fees']]
        fees += [node('Divider'), metric('Required move-in total', money(r['costs']['moveInTotal'])), text(r['costs']['excludes'], 'muted')]
        lease = [heading('Know before you visit'), metric('Available from', r['availableFrom'] or 'Not supplied'), metric('Lease terms', ', '.join(str(n) + ' months' for n in r['leaseMonths']) or 'Not supplied'), metric('Floor / elevator', f"{r['floor']} / {'Yes' if r['elevator'] else 'No'}"), metric('Pets', r['petPolicy']), metric('Utilities included', ', '.join(r['utilitiesIncluded']))]
        amenities = [heading('Around the apartment'), node('List', children=[node('ListItem', children=[text(a)]) for a in r['amenities']]), heading('Getting around'), node('List', children=[node('ListItem', children=[metric(t['name'], str(t['walkMinutes']) + ' min walk')]) for t in r['transit']])]
        reviews = [heading('Resident notes'), text('Synthetic reviews for this example.', 'muted')]
        reviews += [stack([metric(v['author'], str(v['rating']) + '/5'), text(v['text'])]) for v in r['reviews']] or [text('No reviews supplied.')]
        panels = [node('Card', {'padding': 'md', 'variant': 'accent' if i == 0 else 'outlined'}, [stack(items)]) for i, items in enumerate([fees, lease, amenities, reviews])]
        return stack([grid([gallery, summary]), grid(panels)], gap='lg')

    def form(r, extra=False):
        fields = [node('Input', {'name': 'name', 'label': 'Your name', 'required': True, 'type': 'text'}), node('Input', {'name': 'email', 'label': 'Email address', 'required': True, 'type': 'email'}), node('Input', {'name': 'date', 'label': 'Preferred date', 'required': True, 'type': 'date', 'min': '2026-11-02'}), node('Input', {'name': 'phone', 'label': 'Phone', 'required': extra, 'type': 'tel'})]
        if extra:
            fields += [node('Select', {'name': 'tourType', 'label': 'Tour format', 'required': True, 'options': [{'label': 'In person', 'value': 'in-person'}, {'label': 'Video call', 'value': 'video'}]}), node('Checkbox', {'name': 'bringPet', 'label': 'I would like to discuss bringing a pet', 'required': False})]
        inside = [heading('Picture yourself here.', 'h2'), text(r['title']), grid(fields), node('Textarea', {'name': 'message', 'label': 'Anything else?', 'required': False}), row([node('Button', {'label': 'Submit Demo Request', 'variant': 'primary', 'type': 'submit'}), back()])]
        return node('Card', {'padding': 'lg', 'variant': 'outlined', 'recordId': r['id']}, [node('Form', {'apartmentId': r['id'], 'label': f"Demo tour request for apartment {r['id']}"}, [stack(inside)])])

    match = re.search(r'apartment\s+(\d+)', prompt, re.I)
    r = by_id.get(match.group(1) if match else '2', rows[0])
    lower = prompt.lower()
    if 'confirm my demo' in lower or lower == 'confirm':
        details = json.loads(prompt.split('Details: ', 1)[1]) if 'Details: ' in prompt else {}
        root = node('Card', {'padding': 'lg', 'variant': 'accent', 'recordId': r['id']}, [stack([node('Badge', {'text': 'Demo request', 'tone': 'accent'}), heading('Your demo request is ready.', 'h2'), text(r['title']), text(json.dumps(details)), text('No real booking has been made. No property owner was contacted.'), back()])])
    elif 'two independent' in lower:
        root = grid([form(by_id['2']), form(by_id['7'], True)])
    elif 'tour' in lower or lower == 'form':
        root = form(r, 'phone required' in lower or 'video' in lower)
    elif 'detail' in lower:
        root = detail(r)
    elif 'compare' in lower:
        chosen = [by_id[k] for k in ['2', '7', '13']]
        root = stack([heading('Three places. A clearer picture.', 'h2'), text('The same criteria, side by side. Monthly totals exclude optional fees and usage-dependent utilities.', 'muted'), grid([card(a, True) for a in chosen], '3'), back()], gap='lg')
    elif 'no match' in lower or lower == 'empty':
        root = stack([heading('No exact matches', 'h2'), text('No supplied apartment meets these constraints. Try increasing the budget or changing the neighborhood.'), back()])
    else:
        chosen = sorted(rows, key=lambda a: (a['rent'], int(a['id'])))[:12] if 'twelve' in lower else [by_id[k] for k in ['7', '2', '13']]
        root = stack([heading(f'{len(chosen)} places to explore', 'h2'), text('Synthetic listings · fixed monthly costs shown where known', 'muted'), button('Compare these three', 'compare_apartments', {'apartmentIds': ['2', '7', '13']}), grid([card(a) for a in chosen], '1')], gap='lg')
    return {'root': root, 'elements': elements}


def interface(prompt):
    spec = view(prompt)
    patches = [{'op': 'add', 'path': '/root', 'value': spec['root']}]
    queue = [spec['root']]
    while queue:
        key = queue.pop(0)
        element = spec['elements'][key]
        patches.append({'op': 'add', 'path': '/elements/' + key, 'value': element})
        queue.extend(element['children'])
    return '\n'.join(json.dumps(p) for p in patches) + '\n'


if __name__ == '__main__':
    import sys
    print(json.dumps(view(' '.join(sys.argv[1:]) or 'list')))
