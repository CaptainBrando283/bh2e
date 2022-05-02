import {findActorFromItemId, generateDieRollFormula, interpolate} from './shared.js';
import {showMessage} from './chat_messages.js';

export function castMagic(event) {
    let element = event.currentTarget;
    let actor   = findActorFromItemId(element.dataset.id);

    event.preventDefault();
    event.stopPropagation();
    if(actor) {
        invokeMagic(element.dataset.id, actor)
            .then((result) => {
                let attribute = interpolate(`bh2e.fields.labels.attributes.${result.attribute}.long`);
                let item      = actor.items.find((i) => i.id === element.dataset.id);
                let message   = {lost:      !result.successful,
                                 miscast:   false,
                                 ritual:    false,
                                 roll:      {formula: result.formula,
                                             labels: {result: "",
                                                      title:  interpolate("bh2e.messages.titles.attributeTest", {attribute: attribute})},
                                             result:  result.attributeRoll,
                                             success: result.successful,
                                             tested: true},
                                 spellName: result.spellName};
                let data      = {id:   item.id,
                                 data: {cast:     false,
                                        prepared: false}};

                if(result.successful) {
                    data.data.cast             = true;
                    data.data.prepared         = true;
                    message.roll.labels.result = interpolate("bh2e.messages.labels.success");
                } else {
                    message.roll.labels.result = interpolate("bh2e.messages.labels.failure");
                }
                showMessage(actor, "systems/bh2e/templates/messages/cast-magic.hbs", message);
                item.update(data, {diff: true});
            });
    } else {
        console.error(`Failed to locate an actor linked to item id ${element.dataset.id}.`)
    }

    return(false);
}

export function castMagicAsRitual(event) {
    let element = event.currentTarget;
    let actor   = findActorFromItemId(element.dataset.id);

    event.preventDefault();
    event.stopPropagation();
    if(actor) {
        let result    = invokeMagic(element.dataset.id, actor);
        invokeMagic(element.dataset.id, actor)
            .then((result) => {
                let attribute = interpolate(`bh2e.fields.labels.attributes.${result.attribute}.long`);
                let message   = {lost:      false,
                                 miscast:   !result.successful,
                                 ritual:    true,
                                 roll:      {formula: result.formula,
                                             labels: {result: "",
                                                      title:  interpolate("bh2e.messages.titles.attributeTest", {attribute: attribute})},
                                             result:  result.attributeRoll,
                                             success: result.successful,
                                             tested: true},
                                 spellName: result.spellName};

                if(result.successful) {
                    message.roll.labels.result = interpolate("bh2e.messages.labels.success");
                } else {
                    message.roll.labels.result = interpolate("bh2e.messages.labels.failure");
                }
                showMessage(actor, "systems/bh2e/templates/messages/cast-magic.hbs", message);
            });
    } else {
        console.error(`Failed to locate an actor linked to item id ${element.dataset.id}.`)
    }
}

function invokeMagic(magicId, caster) {
    let attributeTest = null;
    let attribute     = null;
    let formula       = null;
    let magic         = caster.items.get(magicId);
    let options       = {};
    let result        = {attribute:     "",
                         attributeRoll: 0,
                         rollType:      "standard",
                         spellLevel:    parseInt(magic.data.data.level),
                         spellName:     magic.name,
                         successful:    false}

    if(event.shiftKey) {
        if(!magic.data.data.cast) {
            options.kind = result.rollType = "advantage";
        }
    } else if(event.ctrlKey || magic.data.data.cast) {
        options.kind = result.rollType = "disadvantage";
    }
    if(!["", "default"].includes(magic.data.data.attribute)) {
        attribute = magic.data.data.attribute;
    } else {
        attribute = (magic.data.data.kind === "prayer" ? "wisdom" : "intelligence");
    }
    formula       = `${generateDieRollFormula(options)}+${result.spellLevel}`;
    attributeTest = new Roll(formula);

    return(attributeTest.roll()
            .then((roll) => {
                result.attribute     = attribute;
                result.attributeRoll = attributeTest.total;
                result.formula       = attributeTest.formula;
                result.successful    = result.attributeRoll < caster.data.data.attributes[attribute];

                if(game.dice3d) {
                    game.dice3d.showForRoll(roll);
                }
                return(result);
            }));
}

export function prepareMagic(event) {
    let element = event.currentTarget;
    let actor   = findActorFromItemId(element.dataset.id);

    event.preventDefault();
    event.stopPropagation();
    if(actor) {
        let item = actor.items.find((i) => i.id === element.dataset.id)
        let data = {id:   item.id,
                    data: {cast:     false,
                           prepared: true}};

        item.update(data, {diff: true});
    } else {
        console.error(`Failed to locate an actor linked to item id ${element.dataset.id}.`)
    }
}


export function unprepareMagic(event) {
    let element = event.currentTarget;
    let actor   = findActorFromItemId(element.dataset.id);

    event.preventDefault();
    event.stopPropagation();
    if(actor) {
        let item = actor.items.find((i) => i.id === element.dataset.id);
        let data = {id:   item.id,
                    data: {cast:     false,
                           prepared: false}};

        item.update(data, {diff: true});
    } else {
        console.error(`Failed to locate an actor linked to item id ${element.dataset.id}.`)
    }
}
